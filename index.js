import Mercury from "@postlight/mercury-parser";
import fs from "fs";
import nodemailer from "nodemailer";
import { displayName, email, password, targetEmail } from './credentials.js';


if (!email) email = 'example@gmail.com';
if (!password) password = '123456';
if (!displayName) displayName = 'Bob';
if (!targetEmail) targetEmail = 'example@kindle.com';

let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: email,
    pass: password
  },
  proxy: process.env.http_proxy
});

let parsedUrlArr = process.argv[2].match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gm);
if (parsedUrlArr.length < 1) {
  console.log('Unable to parse url');
  console.log(parsedUrlArr);
  process.exit(1);
}

let url = parsedUrlArr[0];
console.log("using url:");
console.log(url);

Mercury.parse(url).then((result) => {
  if (result.error) {console.log("error parsing:"); return console.log(result.message)};

  console.log("mercury parsed;");

  let fn = `${result.title.replace(/[\W_]+/g, "_")}.html`;
  let fp = `${process.argv[1].replace(/(\\index.js)|(\/index.js)/gm, "")}/archive/${fn}`;

  let content = `<!DOCTYPE html><html><head><title>${result.title}</title><meta name="author" content="${result.author}"></head><body>`;
  // remove images and links
  content += result.content.replace(/<img[^>]*>|<a[^>]*>|<\/a>/gm, "");
  content += `</body></html>`;
   
  fs.writeFile(fp, content, function (err) {
    if (err) {console.log("error writing file:"); return console.log(err);}
    console.log("Saved!");
    
    let mailOptions = {
      from: `"${displayName}}" ${email}`,
      to: targetEmail,
      subject: 'convert',
      text: "Hello! Here's an article for you.",
      attachments: [
        {
          filename: fn,
          path: fp
        }
      ]
    };
    
    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log("error sending email:");
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
  
  });
});
