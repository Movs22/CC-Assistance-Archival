const fs = require('fs').promises;
const fs2 = require('fs');
const path = require('path');
const moment = require("moment")
const process = require('process');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');


// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/forms', 'https://www.googleapis.com/auth/drive'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), './config/token.json');
const SHEETID = require("../config/config.json").sheet;
const AdvertFormId = require("../config/config.json").AdvertFormId;
const CREDENTIALS_PATH = path.join(process.cwd(), './config/credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
  setInterval(() => {
    client.refreshAccessToken(function (err, tokens) {
      console.log(err)
    });
  }, 24 * 60 * 60 * 1000)
}


/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

async function downloadFile(auth, fileId, fileName) {
  const service = google.drive({ version: 'v3', auth });
  let a = new Promise((resolve) => {
    let w = fs2.createWriteStream("../../SSD/Adverts/" + fileName + ".png")
    service.files.get({
      fileId: fileId,
      alt: 'media',
      mimeType: 'image/png'
    },
      {
        responseType: "stream",
      }).then((res, err) => {
        if (err) {
          console.log(err)
          console.log("FAILED to download file.")
          resolve("0.png")
          return;
        }
        if(res) data = res.data
        data.on("end", () => {
          console.log("DOWNLOADED " + fileId + " as " + fileName + ".png")
          resolve(fileName.split("-")[0])
        }).pipe(w)
      });
  });
  return a.then(b => b)
}

/*
336eb8c7 - areas
155310a0 - username
23890a27 - upload
*/

async function listAdverts(auth) {
  const forms = google.forms({ version: 'v1', auth });
  const res = await forms.forms.responses.list({
    formId: AdvertFormId
  });
  if(!res || !res.data.responses || res.data.responses.length === 0) return {adverts: []};
  let ads = []
  let a = new Promise(async (resolve) => {
  for(let resp of res.data.responses) {
    let response = await forms.forms.responses.get({
      formId: AdvertFormId,
      responseId: resp.responseId
    })
    let y;
    if (response && response.data.answers) {
      y = { name: response.data.answers["155310a0"].textAnswers.answers, link: response.data.answers["23890a27"].fileUploadAnswers.answers, responseId: resp.responseId }
      ads.push(y)
    }
  }
  resolve(ads)
  })
  let c = a.then(b => {
    return { adverts: b};
  })
  return c
}

async function listPlots(auth, village) {
  if (!village) village = "TEST"
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEETID,
    range: village + '!B4:I',
  });
  if (res && res.data.values.length > 0) {
    let r = {}
    let i = 7
    gov = res.data.values[0][0].split(": ")[1]
    res.data.values.slice(3).forEach(row => {
      if (row[0] !== '') {
        let b = { plot: row[0], owner: row[1], claimedAt: moment(row[4], "DD/MM/YYYY").unix(), r48: moment(row[5], "DD/MM/YYYY").unix(), r24: moment(row[6], "DD/MM/YYYY").unix(), expires: moment(row[7], "DD/MM/YYYY").unix(), status: (row[8] ? "TRUE" : "FALSE"), index: i, ownerId: row[3], ownerUUID: row[2] }
        i += 1;
        eval("r." + row[0] + " = b")
      };
    })
    return { data: r, rows: i, governor: gov }
  } else {
    return null
  }
}

async function saveData(auth) {
  const sheets = google.sheets({ version: 'v4', auth });
  let points
  let reminders
  let config
  try {
    points = fs2.readFileSync("./data/points.json", { encoding: "utf-8" })
    reminders = fs2.readFileSync("./data/reminders.json", { encoding: "utf-8" })
    config = fs2.readFileSync("./data/users.json", { encoding: "utf-8" })
  } catch (e) {
    console.log(e)
    this.loadData(auth);
    console.log("FAILED to sync data. Databases weren't found or are in the wrong directory")
    return;
  }
  if (points === "" || reminders === "" || config === "") {
    this.loadData(auth);
    console.log("FAILED to sync data. Databases weren't found or are in the wrong directory")
    return;
  }
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEETID,
    range: 'DB (DONT TOUCH)!A5:C5',
    valueInputOption: 'RAW',
    resource: {
      values: [[points, reminders, config]]
    }
  });
  console.log("Synced data with cloud.")
}

async function loadData(auth) {
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEETID,
    range: 'DB (DONT TOUCH)!A5:C5',
  });
  let z = res.data.values[0];
  console.log("Successfully loaded data from the cloud. Points.json: " + z[0].length + " bytes | Reminders.json: " + z[1].length + " bytes | Users.json: " + z[2].length + " bytes")
  await fs.writeFile("./data/points.json", z[0]);
  await fs.writeFile("./data/reminders.json", z[1]);
  await fs.writeFile("./data/users.json", z[2]);
}

async function createPlot(auth, id, _, village, amount, offset) {
  if (!village) village = "TEST"
  let plots = await listPlots(auth, village)
  const sheets = google.sheets({ version: 'v4', auth });
  let plot = plots.data[id]
  if (plot) return { status: "Plot already exists." }
  let v = [[id + (1 + offset)]]
  if (amount) {
    for (let i = 2; i < amount + 1; i++) {
      v.push([id + (i + offset)])
      let plot = plots.data[id + (i + offset)]
      if (plot) return { status: "Plot already exists." }
    }
  }
  const res = await sheets.spreadsheets.values.update({
    spreadsheetId: SHEETID,
    range: village + '!B' + plots.rows + ':B' + (plots.rows + amount),
    valueInputOption: 'RAW',
    resource: {
      values: v
    }
  });
  if (res.status === 200) {
    p = await listPlots(auth, village)
    return { status: 200, plots: p };
  } else {
    return { status: res.status };
  }
}

async function claimPlot(auth, plotId, owner, village, ownerId, ownerUUID) {
  if (!village) village = "TEST"
  let plots = await listPlots(auth, village)
  let plot = plots.data[plotId]
  if (!plot) {
    return { status: 404 };
  }
  /*if(plot.owner !== "" && plot.owner !== undefined && owner !== null) {
    return {status: "Plot already claimed"}
  }*/
  const sheets = google.sheets({ version: 'v4', auth });
  function getDate(offset) {
    if (!offset) offset = 24 * 60 * 60 * 1000
    return (parseInt(new Date(Date.now() + offset).getDate())) + "/" + (parseInt(new Date(Date.now() + offset).getMonth()) + 1) + "/" + new Date(Date.now() + offset).getFullYear()
  }
  let res;
  if (owner === null) {
    res = await sheets.spreadsheets.values.update({
      spreadsheetId: SHEETID,
      range: village + '!B' + plot.index + ':J' + plot.index,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [
          [plotId, "", "", "", "", "", "", ""]
        ]
      }
    });
  } else {
    res = await sheets.spreadsheets.values.update({
      spreadsheetId: SHEETID,
      range: village + '!B' + plot.index + ':J' + plot.index,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [
          [plotId, owner, ownerUUID, ownerId, getDate(), getDate(12 * 24 * 60 * 60 * 1000), getDate(13 * 24 * 60 * 60 * 1000), getDate(14 * 24 * 60 * 60 * 1000), false]
        ]
      }
    });
  }

  if (res.status === 200) {
    return { status: 200, time: getDate(14 * 24 * 60 * 60 * 1000), plots: await listPlots(auth, village) };
  } else {
    return { status: res.status };
  }
}

async function extendPlot(auth, plotId, owner, village, ownerId, ownerUUID, oldDate, newDate) {
  if (!village) village = "TEST"
  let plots = await listPlots(auth, village)
  let plot = plots.data[plotId]
  if (!plot) {
    return { status: 404 };
  }
  const sheets = google.sheets({ version: 'v4', auth });
  function getDate(offset) {
    //if(!offset) offset = 24*60*60*1000
    return (parseInt(new Date(newDate + offset).getDate())) + "/" + (parseInt(new Date(newDate + offset).getMonth()) + 1) + "/" + new Date(newDate + offset).getFullYear()
  }
  function getDate2() {
    offset = 0
    return (parseInt(new Date(oldDate * 1000 + offset).getDate())) + "/" + (parseInt(new Date(oldDate * 1000 + offset).getMonth()) + 1) + "/" + new Date(oldDate * 1000 + offset).getFullYear()
  }
  let res;
  if (owner === null) {
    res = await sheets.spreadsheets.values.update({
      spreadsheetId: SHEETID,
      range: village + '!B' + plot.index + ':J' + plot.index,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [
          [plotId, "", "", "", "", "", "", ""]
        ]
      }
    });
  } else {
    res = await sheets.spreadsheets.values.update({
      spreadsheetId: SHEETID,
      range: village + '!B' + plot.index + ':J' + plot.index,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [
          [plotId, owner, ownerUUID, ownerId, getDate2(), getDate(-24 * 60 * 60 * 1000), getDate(0), getDate(24 * 60 * 60 * 1000), false]
        ]
      }
    });
  }

  if (res.status === 200) {
    return { status: 200, time: getDate(14 * 24 * 60 * 60 * 1000), plots: await listPlots(auth, village) };
  } else {
    return { status: res.status };
  }
}

module.exports.authorize = authorize;
module.exports.listPlots = listPlots;

module.exports.listAdverts = listAdverts;

module.exports.createPlot = createPlot;
module.exports.claimPlot = claimPlot;
module.exports.extendPlot = extendPlot;

module.exports.saveData = saveData;
module.exports.loadData = loadData;
module.exports.downloadFile = downloadFile;
