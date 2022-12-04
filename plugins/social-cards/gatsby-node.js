// TODO only do this when in production mode
const puppeteer = require('puppeteer')
const {spawn, exec} = require('child_process');
// const { join } = require('path');
const { promises: fs } = require("fs");

// const readdir = util.promisify(fs.readdir);

/*

# We don't need the standalone Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

# Install Google Chrome Stable and fonts
# Note: this installs the necessary libs to make the browser work with Puppeteer.
RUN apt-get update && apt-get install curl gnupg -y \
  && curl --location --silent https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
  && apt-get update \
  && apt-get install google-chrome-stable -y --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*
*/

const filePrefix = "social-card-"
const fileExt = ".jpg";
const selector = '#gatsby-social-card';
const staticDir = './public/static/'

const hashCache = {};

const takeScreenshot = async (page, path) => {
  const url =  `http://localhost:9000${path}?generateSocialCard`;
  await page.goto(url, { waituntil: "networkidle0" });
  await page.waitForSelector(selector); // wait
  const hash = await page.$$eval(selector, el => el[0].getAttribute("data-hash"));
  // skip if there is no hash
  if (!hash) {
    throw Error(`Page did not include the social card component ${url}`);
  }
  hashCache[hash] = { keep: true }
  if (!hashCache[hash]) { 
    console.log('screenshotting', url, hash);
    await page.screenshot({
      path: `${staticDir}${filePrefix}${hash}${fileExt}`,
      clip: {
        x: 0,
        y: 0,
        width: 1200,
        height: 630,
      },
    })
    hashCache[hash].generated = true;
  }
}

async function takeScreenshots(graphql) {
  // TODO populate the hash cache.
  // read static to check for hashes
  (await fs.readdir(staticDir)).forEach(file => {
    if (file.startsWith(filePrefix)) {
      const hash = file.split(".")[0].replace(filePrefix, "");
      hashCache[hash] = { }
    }
  })
  // start puppeteers
  const browser = await puppeteer.launch({
    // TODO allow this option to be bassed
    // eg for use inside docker (like now)
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox'],
  })
  const page = await browser.newPage();

  const pages = await graphql(`
    query AllSitePage {
      allSitePage {
        edges {
          node {
            path
          }
        }
      }
    }  
  `);
  for ({ node } of pages.data.allSitePage.edges) {
    // TODO figure out a good name name w/ caching
    // TODO take multiple shots if configured
    await takeScreenshot(page, node.path)
  }
  // todo clean up the cache
  let generated = 0
  let cached = 0
  for (hash of Object.keys(hashCache)) {
    if (!hashCache[hash].keep) {
      await fs.unlink(`${staticDir}${filePrefix}${hash}${fileExt}`)
      return;
    }
    if (hashCache[hash].generated) {
      generated += 1;
    } else {
      cached += 1;
    }
  }
  await browser.close();
  return { generated, cached };
}

exports.onPostBuild = async (params) => {
  const { graphql, reporter, basePath, pathPrefix } = params;
  reporter.info("Generating social cards...");
  // TODO find a better way to do this
  // TODO have some way of creating a random port and killing it aterwards
  exec('fuser -k 9000/tcp');
  // start the server
  const server = spawn('./node_modules/.bin/gatsby', ["serve"]);
  await new Promise((resolve, reject) => {
    server.stdout.on('data', async (data) => {
      if (`${data}`.includes("You can now view")) {
        const { generated, cached } = await takeScreenshots(graphql);
        reporter.info(`Created social cards: ${generated} new, ${cached} cached`)
        resolve()
      }
      if (`${data}`.includes("Something is already running at")) {
        reject("Server is already running on port 9000, please stop the server (pkill node)");
      }
    });
    server.stderr.on('data', (data) => {
      reject(`stderr: ${data}`);
    });
    server.on('exit', (code) => {
      console.log(`child process exited with code ${code}`);
      resolve()
    });
  })
  server.kill()
};
