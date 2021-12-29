/* --------------------------------- SERVER --------------------------------- */
const express = require("express");
const app = express();
app.use(express.urlencoded({ extended: true }));
const port = process.env.PORT || 8000;
app.get("/", (req, res) => {
  res.send("Bot is running fine... no tension :)");
});
app.listen(port, () => {
  console.log("\nWeb-server running!\n");
});

// setTimeout(() => {
//   process.exit();
// }, 1000 * 60 * 60 * 3); //3 hours

/* ------------------------------------ Baiileys ----------------------------------- */
const {
  WAConnection,
  MessageType,
  Mimetype,
  GroupSettingChange,
} = require("@adiwajshing/baileys");

const {
  setCountMember,
  getCountGroups,
  getCountGroupMembers,
  getCountTop,
} = require("./countMemberDB");
const {
  setCountMemberTM,
  getCountGroupsTM,
  getCountGroupMembersTM,
  getCountTopTM,
} = require("./tmDB");
const { setCountVideo, getCountVideo } = require("./videoDB");

prefix = "?";

let pvxstickeronly1 = "919557666582-1628610549@g.us";
let pvxstickeronly2 = "919557666582-1586018947@g.us";
let mano = "19016677357-1630334490@g.us";

let allowedNumb = [
  "919557666582@s.whatsapp.net",
  "918384813814@s.whatsapp.net",
  "919096501846@s.whatsapp.net",
  "917021298661@s.whatsapp.net",
];

const more = String.fromCharCode(8206);
const readMore = more.repeat(4001);

const getGroupAdmins = (participants) => {
  admins = [];
  for (let i of participants) {
    i.isAdmin ? admins.push(i.jid) : "";
  }
  return admins;
};

let countSent = 1;

// LOAD ADDITIONAL NPM PACKAGES
const WSF = require("wa-sticker-formatter");

//MAIN FUNCTION
const main = async () => {
  const { connectToWA } = require("./authDBheroku");
  const conn = await connectToWA(WAConnection);
  let botNumberJid = conn.user.jid;

  // new message
  conn.on("chat-update", async (mek) => {
    try {
      if (!mek.hasNewMessage) return;
      try {
        mek = JSON.parse(JSON.stringify(mek)).messages[0];
      } catch {
        return;
      }
      if (!mek.message) return;
      if (mek.key && mek.key.remoteJid == "status@broadcast") return;
      const content = JSON.stringify(mek.message);
      global.prefix;
      const from = mek.key.remoteJid;
      const type = Object.keys(mek.message)[0];

      //body will have the text message
      let body =
        type === "conversation" && mek.message.conversation.startsWith(prefix)
          ? mek.message.conversation
          : type == "imageMessage" &&
            mek.message.imageMessage.caption &&
            mek.message.imageMessage.caption.startsWith(prefix)
          ? mek.message.imageMessage.caption
          : type == "videoMessage" &&
            mek.message.videoMessage.caption &&
            mek.message.videoMessage.caption.startsWith(prefix)
          ? mek.message.videoMessage.caption
          : type == "extendedTextMessage" &&
            mek.message.extendedTextMessage.text &&
            mek.message.extendedTextMessage.text.startsWith(prefix)
          ? mek.message.extendedTextMessage.text
          : "";

      if (body[1] == " ") body = body[0] + body.slice(2); //remove space when space btw prefix and commandName like "! help"
      const command = body.slice(1).trim().split(/ +/).shift().toLowerCase();
      const args = body.trim().split(/ +/).slice(1);
      const isCmd = body.startsWith(prefix);

      const isGroup = from.endsWith("@g.us");
      // console.log(mek);
      let sender = isGroup ? mek.participant : from;
      if (mek.key.fromMe) sender = botNumberJid;
      const groupMetadata = isGroup ? await conn.groupMetadata(from) : "";
      const groupName = isGroup ? groupMetadata.subject : "";
      const groupDesc = isGroup ? groupMetadata.desc : "";
      const groupMembers = isGroup ? groupMetadata.participants : "";
      const groupAdmins = isGroup ? getGroupAdmins(groupMembers) : "";

      if (
        isGroup &&
        groupName.toUpperCase().includes("<{PVX}>") &&
        from !== pvxstickeronly1 &&
        from != pvxstickeronly2
      ) {
        setCountMember(sender, from);
        setCountMemberTM(sender, from);
      }

      //count video
      if (isGroup && mek.message.videoMessage && from == mano) {
        setCountVideo(sender, from);
      }

      if (
        isGroup &&
        mek.message.stickerMessage &&
        groupName.startsWith("<{PVX}>") &&
        from !== pvxstickeronly1 &&
        from != pvxstickeronly2 &&
        from !== mano
      ) {
        // mek.key.fromMe == false &&
        // SEND STICKER
        const mediaSticker = await conn.downloadAndSaveMediaMessage({
          message: mek.message,
        });
        // "<{PVX}> BOT ??"
        const webpWithMetadataSticker = await WSF.setMetadata(
          "BOT ??",
          "pvxcommunity.com",
          mediaSticker
        );
        await conn.sendMessage(
          pvxstickeronly1,
          webpWithMetadataSticker,
          MessageType.sticker
        );
        await conn.sendMessage(
          pvxstickeronly2,
          webpWithMetadataSticker,
          MessageType.sticker
        );
        console.log(`${countSent} sticker sent!`);
        countSent += 1;
      }

      if (!isCmd) return;

      const isMedia = type === "imageMessage" || type === "videoMessage"; //image or video
      const isTaggedImage =
        type === "extendedTextMessage" && content.includes("imageMessage");
      const isTaggedVideo =
        type === "extendedTextMessage" && content.includes("videoMessage");
      const isTaggedSticker =
        type === "extendedTextMessage" && content.includes("stickerMessage");
      const isTaggedDocument =
        type === "extendedTextMessage" && content.includes("documentMessage");

      // Display every command info
      console.log(
        "[COMMAND]",
        command,
        "[FROM]",
        sender.split("@")[0],
        "[IN]",
        groupName
      );

      const reply = (message) => {
        conn.sendMessage(from, message, MessageType.text, {
          quoted: mek,
        });
      };

      const sendText = (message) => {
        conn.sendMessage(from, message, MessageType.text);
      };

      // send every command info to my whatsapp, won't work when i send something for bot
      if ("919557666582@s.whatsapp.net" !== sender) {
        await conn.sendMessage(
          "919557666582@s.whatsapp.net",
          `[${prefix}${command}] [${groupName}]`,
          MessageType.text
        );
      }

      switch (command) {
        case "alive":
        case "a":
          reply(`*-? <{PVX}> BOT ? -*\n\nYES! BOT IS ALIVE !!!`);
          break;

        case "delete":
        case "d":
          try {
            if (!mek.message.extendedTextMessage) {
              reply(`? Tag message of bot to delete.`);
              return;
            }
            if (
              botNumberJid ==
              mek.message.extendedTextMessage.contextInfo.participant
            ) {
              const chatId =
                mek.message.extendedTextMessage.contextInfo.stanzaId;
              await conn.deleteMessage(from, {
                id: chatId,
                remoteJid: from,
                fromMe: true,
              });
            } else {
              reply(`? Tag message of bot to delete.`);
            }
          } catch (err) {
            console.log(err);
            reply(`? Error!`);
          }
          break;

        /* --------------------------------- zero --------------------------------- */
        case "zero":
          try {
            if (!isGroup) {
              reply("? Group command only!");
              return;
            }
            if (!allowedNumb.includes(sender)) {
              reply(`? Not Allowed!`);
              return;
            }
            let resultCountGroupIndi = await getCountGroupMembersTM(from);
            let memWithMsg = new Set();
            for (let member of resultCountGroupIndi) {
              memWithMsg.add(member.memberjid);
            }
            let zeroMsg = `${groupName}\nMembers with 0 message this month:\n${readMore}`;
            groupMembers.forEach((mem) => {
              if (!memWithMsg.has(mem.jid)) {
                zeroMsg += `\n${mem.jid.split("@")[0]}`;
              }
            });
            reply(zeroMsg);
          } catch (err) {
            console.log(err);
            reply(`? Error!`);
          }
          break;

        /* --------------------------------- pvxg --------------------------------- */
        case "pvxg":
          try {
            if (!isGroup) {
              reply("? Group command only!");
              return;
            }
            if (!allowedNumb.includes(sender)) {
              reply(`? Not Allowed!`);
              return;
            }
            let resultCountGroup = await getCountGroups();
            let countGroupMsg = `*?? PVX GROUP STATS ??*\n_From 24 Nov 2021_\n`;

            let countGroupMsgTemp = "\n";
            let totalGrpCount = 0;
            for (let group of resultCountGroup) {
              try {
                let mdpvx = await conn.groupMetadata(group.groupjid);
                let grpName = mdpvx.subject;
                if (!grpName || !grpName.toUpperCase().includes("<{PVX}>"))
                  continue; //not a pvx group
                // grpName = grpName.split(" ")[1];
                grpName = grpName.replace("<{PVX}> ", "");
                totalGrpCount += Number(group.count);
                countGroupMsgTemp += `\n${group.count} - ${grpName}`;
              } catch (err) {
                console.log("Error in getting metadata of " + group.groupjid);
              }
            }
            countGroupMsg += `\n*Total Messages: ${totalGrpCount}*`;
            countGroupMsg += countGroupMsgTemp;
            reply(countGroupMsg);
          } catch (err) {
            console.log(err);
            reply(`? Error!`);
          }
          break;

        /* --------------------------------- pvxt --------------------------------- */
        case "pvxt":
          try {
            if (!isGroup) {
              reply("? Group command only!");
              return;
            }
            if (!allowedNumb.includes(sender)) {
              reply(`? Not Allowed!`);
              return;
            }

            let resultCountGroupTop = await getCountTop();
            let countGroupMsgTop = `*?? PVX TOP MEMBERS ??*\n_From 24 Nov 2021_\n`;

            let countGroupMsgTempTop = "\n";
            let totalGrpCountTop = 0;
            for (let member of resultCountGroupTop) {
              totalGrpCountTop += Number(member.count);
              let user = conn.contacts[member.memberjid];
              let username = user
                ? user.notify ||
                  user.vname ||
                  user.name ||
                  member.memberjid.split("@")[0]
                : member.memberjid.split("@")[0];
              countGroupMsgTempTop += `\n${member.count} - ${username}`;
            }
            countGroupMsgTop += `\n*Total Messages: ${totalGrpCountTop}*`;
            countGroupMsgTop += countGroupMsgTempTop;
            reply(countGroupMsgTop);
          } catch (err) {
            console.log(err);
            reply(`? Error!`);
          }
          break;

        /* --------------------------------- pvxv --------------------------------- */
        case "pvxv":
          try {
            if (!isGroup) {
              reply("? Group command only!");
              return;
            }
            // if (!allowedNumb.includes(sender)) {
            //   reply(`? Not Allowed!`);
            //   return;
            // }

            let resultCountGroupIndi = await getCountVideo(mano);
            let countGroupMsgIndi = `*?? MANO VIDEO COUNT*\n_From 13 DEC 2021_${readMore}\n`;
            let memWithMsg = new Set();
            for (let member of resultCountGroupIndi) {
              memWithMsg.add(member.memberjid);
            }

            let countGroupMsgTempIndi = "\n";
            let totalGrpCountIndi = 0;
            for (let member of resultCountGroupIndi) {
              totalGrpCountIndi += member.count;
              let user = conn.contacts[member.memberjid];
              let username = user
                ? user.notify ||
                  user.vname ||
                  user.name ||
                  member.memberjid.split("@")[0]
                : member.memberjid.split("@")[0];
              countGroupMsgTempIndi += `\n${member.count} - ${username}`;
            }

            let md = await conn.groupMetadata(mano);

            md.participants.forEach((mem) => {
              if (!memWithMsg.has(mem.jid)) {
                let user = conn.contacts[mem.jid];
                let username = user
                  ? user.notify ||
                    user.vname ||
                    user.name ||
                    mem.jid.split("@")[0]
                  : mem.jid.split("@")[0];
                countGroupMsgTempIndi += `\n${0} - ${username}`;
              }
            });

            countGroupMsgIndi += `\n*Total Messages: ${totalGrpCountIndi}*`;
            countGroupMsgIndi += countGroupMsgTempIndi;
            reply(countGroupMsgIndi);
          } catch (err) {
            console.log(err);
            reply(`? Error!`);
          }
          break;
        /* --------------------------------- pvxm --------------------------------- */
        case "pvxm":
          try {
            if (!isGroup) {
              reply("? Group command only!");
              return;
            }
            if (!allowedNumb.includes(sender)) {
              reply(`? Not Allowed!`);
              return;
            }

            let resultCountGroupIndi = await getCountGroupMembers(from);

            let memWithMsg = new Set();
            for (let member of resultCountGroupIndi) {
              memWithMsg.add(member.memberjid);
            }

            let countGroupMsgIndi = `*${groupName}*\n_From 24 Nov 2021_${readMore}\n`;

            let countGroupMsgTempIndi = "\n";
            let totalGrpCountIndi = 0;
            for (let member of resultCountGroupIndi) {
              totalGrpCountIndi += member.count;
              let user = conn.contacts[member.memberjid];
              let username = user
                ? user.notify ||
                  user.vname ||
                  user.name ||
                  member.memberjid.split("@")[0]
                : member.memberjid.split("@")[0];
              countGroupMsgTempIndi += `\n${member.count} - ${username}`;
            }

            groupMembers.forEach((mem) => {
              if (!memWithMsg.has(mem.jid)) {
                let user = conn.contacts[mem.jid];
                let username = user
                  ? user.notify ||
                    user.vname ||
                    user.name ||
                    mem.jid.split("@")[0]
                  : mem.jid.split("@")[0];
                countGroupMsgTempIndi += `\n${0} - ${username}`;
              }
            });

            countGroupMsgIndi += `\n*Total Messages: ${totalGrpCountIndi}*`;
            countGroupMsgIndi += countGroupMsgTempIndi;
            reply(countGroupMsgIndi);
          } catch (err) {
            console.log(err);
            reply(`? Error!`);
          }
          break;

        /* ---------------------------- THIS MONTH STATS ---------------------------- */
        /* --------------------------------- pvxgg --------------------------------- */
        case "pvxgg":
          try {
            if (!isGroup) {
              reply("? Group command only!");
              return;
            }
            if (!allowedNumb.includes(sender)) {
              reply(`? Not Allowed!`);
              return;
            }
            let resultCountGroup = await getCountGroupsTM();
            let countGroupMsg = `*?? PVX GROUP STATS ??*\n_THIS MONTH_\n`;

            let countGroupMsgTemp = "\n";
            let totalGrpCount = 0;
            for (let group of resultCountGroup) {
              try {
                let mdpvx = await conn.groupMetadata(group.groupjid);
                let grpName = mdpvx.subject;
                if (!grpName || !grpName.toUpperCase().includes("<{PVX}>"))
                  continue; //not a pvx group
                // grpName = grpName.split(" ")[1];
                grpName = grpName.replace("<{PVX}> ", "");
                totalGrpCount += Number(group.count);
                countGroupMsgTemp += `\n${group.count} - ${grpName}`;
              } catch (err) {
                console.log("Error in getting metadata of " + group.groupjid);
              }
            }
            countGroupMsg += `\n*Total Messages: ${totalGrpCount}*`;
            countGroupMsg += countGroupMsgTemp;
            reply(countGroupMsg);
          } catch (err) {
            console.log(err);
            reply(`? Error!`);
          }
          break;

        /* --------------------------------- pvxtt --------------------------------- */
        case "pvxtt":
          try {
            if (!isGroup) {
              reply("? Group command only!");
              return;
            }
            if (!allowedNumb.includes(sender)) {
              reply(`? Not Allowed!`);
              return;
            }

            let resultCountGroupTop = await getCountTopTM();
            let countGroupMsgTop = `*?? PVX TOP MEMBERS ??*\n_THIS MONTH_\n`;

            let countGroupMsgTempTop = "\n";
            let totalGrpCountTop = 0;
            for (let member of resultCountGroupTop) {
              totalGrpCountTop += Number(member.count);
              let user = conn.contacts[member.memberjid];
              let username = user
                ? user.notify ||
                  user.vname ||
                  user.name ||
                  member.memberjid.split("@")[0]
                : member.memberjid.split("@")[0];
              countGroupMsgTempTop += `\n${member.count} - ${username}`;
            }
            countGroupMsgTop += `\n*Total Messages: ${totalGrpCountTop}*`;
            countGroupMsgTop += countGroupMsgTempTop;
            reply(countGroupMsgTop);
          } catch (err) {
            console.log(err);
            reply(`? Error!`);
          }
          break;

        /* --------------------------------- pvxmm --------------------------------- */
        case "pvxmm":
          try {
            if (!isGroup) {
              reply("? Group command only!");
              return;
            }
            if (!allowedNumb.includes(sender)) {
              reply(`? Not Allowed!`);
              return;
            }

            let resultCountGroupIndi = await getCountGroupMembersTM(from);

            let memWithMsg = new Set();
            for (let member of resultCountGroupIndi) {
              memWithMsg.add(member.memberjid);
            }

            let countGroupMsgIndi = `*${groupName}*\n_THIS MONTH_${readMore}\n`;

            let countGroupMsgTempIndi = "\n";
            let totalGrpCountIndi = 0;
            for (let member of resultCountGroupIndi) {
              totalGrpCountIndi += member.count;
              let user = conn.contacts[member.memberjid];
              let username = user
                ? user.notify ||
                  user.vname ||
                  user.name ||
                  member.memberjid.split("@")[0]
                : member.memberjid.split("@")[0];
              countGroupMsgTempIndi += `\n${member.count} - ${username}`;
            }

            groupMembers.forEach((mem) => {
              if (!memWithMsg.has(mem.jid)) {
                let user = conn.contacts[mem.jid];
                let username = user
                  ? user.notify ||
                    user.vname ||
                    user.name ||
                    mem.jid.split("@")[0]
                  : mem.jid.split("@")[0];
                countGroupMsgTempIndi += `\n${0} - ${username}`;
              }
            });

            countGroupMsgIndi += `\n*Total Messages: ${totalGrpCountIndi}*`;
            countGroupMsgIndi += countGroupMsgTempIndi;
            reply(countGroupMsgIndi);
          } catch (err) {
            console.log(err);
            reply(`? Error!`);
          }
          break;

        /* ------------------------------- CASE: PVXSTATS ------------------------------ */
        case "pvxstats":
          try {
            if (!isGroup) {
              reply("? Group command only!");
              return;
            }
            if (!allowedNumb.includes(sender)) {
              reply(`? Not Allowed!`);
              return;
            }

            let groups = conn.chats
              .all()
              .filter(
                (v) =>
                  v.jid.endsWith("g.us") &&
                  !v.read_only &&
                  v.message &&
                  !v.announce &&
                  v.name.startsWith("<{PVX}>")
              )
              .map((v) => {
                return { name: v.name, jid: v.jid };
              });
            // console.log(groups);

            let pvxMsg = `*?? PVX STATS ??*${readMore}`;
            let totalMem = 0;
            let uniqueMem = new Set();
            let temppvxMsg = "";
            let temppvxList = [];
            for (let group of groups) {
              const mdpvx = await conn.groupMetadata(group.jid);
              // console.log(mdpvx);
              totalMem += mdpvx.participants.length;
              temppvxList.push({
                subject: mdpvx.subject,
                count: mdpvx.participants.length,
              });

              for (let parti of mdpvx.participants) {
                uniqueMem.add(parti.jid);
              }
            }
            temppvxList = temppvxList.sort((x, y) => y.count - x.count); //sort

            temppvxList.forEach((grp) => {
              temppvxMsg += `\n\n*${grp.subject}*\nMembers: ${grp.count}`;
            });

            pvxMsg += `\nTotal Groups: ${groups.length}\nTotal Members: ${totalMem}\nUnique Members: ${uniqueMem.size}`;
            pvxMsg += temppvxMsg;
            reply(pvxMsg);
          } catch (err) {
            console.log(err);
            reply(`? Error!`);
          }
          break;

        case "tg":
          if ("919557666582@s.whatsapp.net" !== sender) {
            reply(`? Owner only command for avoiding spam!`);
            return;
          }
          if (!isTaggedDocument) {
            reply(`? Send zip document file!`);
            return;
          }

          try {
            const encmediatg = JSON.parse(
              JSON.stringify(mek).replace("quotedM", "m")
            ).message.extendedTextMessage.contextInfo;

            console.log("downloading...");
            const mediatg = await conn.downloadAndSaveMediaMessage(encmediatg);
            console.log("downloaded", mediatg);

            // reading zip
            let zip = new AdmZip(`./${mediatg}`);
            // extracts everything
            zip.extractAllTo(`./`, true);
            let zipEntries = zip.getEntries(); // an array of ZipEntry records

            let stickerCounttg = zipEntries.length;
            console.log("extracted: files " + stickerCounttg);

            reply(`? Sending all ${stickerCounttg} stickers`);
            let itg = -1;
            setIntervaltg = setInterval(async () => {
              itg += 1;

              //last file
              if (itg >= stickerCounttg - 1) {
                clearInterval(setIntervaltg);
                reply(`? Finished!`);
              }
              console.log("Sending sticker ", itg);
              if (zipEntries[itg].entryName.endsWith(".webp")) {
                let filepath = `${__dirname}`;
                //add slash of not present
                filepath += zipEntries[itg].entryName.startsWith("/")
                  ? ""
                  : "/";
                filepath += `${zipEntries[itg].entryName}`;

                //"<{PVX}> BOT ??"
                //"https://pvxcommunity.com"
                const webpWithMetadatatg = await WSF.setMetadata(
                  "",
                  "pvxcommunity.com",
                  filepath
                );
                await conn.sendMessage(
                  from,
                  webpWithMetadatatg,
                  MessageType.sticker
                );
              }
            }, 0);
          } catch (err) {
            console.log(err);
            reply(`? Some error came!`);
          }
          break;
      }
    } catch (err) {
      console.log(err);
    }
  });
};
main();
