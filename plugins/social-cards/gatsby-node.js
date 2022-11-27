// TODO only do this when in production mode
const puppeteer = require('puppeteer')
const {spawn} = require('child_process');
const { join } = require('path');

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

const takeScreenshot = async (url, destination) => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    // TODO make sure this doesn't get executed when 
    // the user isnt running inside docker, or just tell them to
    // otherwise be careful
    args: ['--no-sandbox'],
  })
  const page = await browser.newPage()
  await page.goto(url, { waituntil:"networkidle0"})
  await page.waitForSelector('#gatsby-social-card'); // wait
  await page.screenshot({
    path: destination,
    clip: {
      x: 0,
      y: 0,
      width: 1200,
      height: 630,
    },
  })
  // TODO navigate to next page
  await browser.close()
}

exports.onPostBuild = async (params) => {
  const { reporter, basePath, pathPrefix } = params;
  reporter.info("lets genreate some screenshots...");
  console.log('starting server')
  const server = spawn('./node_modules/.bin/gatsby', ["serve"]);
  // TODO have some way of creating a random port and killing it
  await new Promise((resolve) => {
    server.stdout.on('data', async (data) => {
      console.log(`stdout: ${data}`);
      if (`${data}`.includes("You can now view")) {
        const destinationFile = join(process.env.PWD, `hello-share.png`)
        await takeScreenshot(`http://localhost:9000/?generateSocialCard`, destinationFile)
        console.log(`Created ${destinationFile}`)
        resolve()
      }
      if (`${data}`.includes("Something is already running at")) {
        console.log("have the user kill the server")
        resolve()
      }
    });
  
    server.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
      resolve()
    });
    
    server.on('exit', (code) => {
      console.log(`child process exited with code ${code}`);
      resolve()
    });
  })

  server.kill()
  // run the dev server...

  
  // copy into static

  // stop the dev server...
};
