//Proprietà server
const Discord = require("discord.js");
const client = new Discord.Client();
var guildG = new Discord.Guild();
var channelBotG = new Discord.Channel();
//Database
TAFFY = require("taffy");
var db = TAFFY([]);
const fs = require("fs");
//Inserimento membro
var functionBotID = 0;
var nMember;
//Informazioni generali
var version = "0.2.3 (Beta)";

//Salva il database in un file
function saveMembers() {
  fs.writeFile("./elenco.json", db().stringify(), (err) => {
    if (err) {
      console.error(err);
    } 
  });
}

//Carica il database dal file
function loadMembers() {
  var dbFile = JSON.parse(fs.readFileSync("./elenco.json", "utf8"));
  for (var key in dbFile) {
    if (dbFile.hasOwnProperty(key)) {
      db.insert({discordID:dbFile[key].discordID,type:dbFile[key].type,discord:dbFile[key].discord,telegram:dbFile[key].telegram,notes:dbFile[key].notes});
    }
  }
}

//Restituisce membro dal parametro di un comando
function getMember(p) {
  var m = p.substring(2, p.length - 1);
  if (m.charAt(0) == "!") {
    m = m.substring(1);
  }
  return guildG.members.get(m);
}

function getMemberType(m) {
  if(m.roles.exists("name", "Ospiti")) {
    return 0;
  }
  else if (m.roles.exists("name", "Membri"))
  {
    return 1;
  }
  else if (m.roles.exists("name", "Tecnico"))
  {
    return 3;
  }
  else if (m.roles.exists("name", "Admin"))
  {
    return 4;
  }
  else if (m.roles.exists("name", "Founder"))
  {
    return 5;
  }
}

//Funzione di avvio inserimento membro
function requestDetails(member) {
  var t = "";
  if(member.user.username == "UtenteTelegram") {
    t += "Inserisci il nome dell'utente Telegram ed eventuali note personalizzate.\n";
  }
  else
  {
    t += "Inserisci l'eventuale nome su Telegram e/o delle note personalizzate di <@" + member.id + ">\n";
  }
  t += "Separa le due informazioni con un trattino.\nSe si vuole lasciare vuoti i campi, scrivere soltanto il trattino.";
  channelBotG.send(t);
  functionBotID = 1;
  nMember = member;
}

//Stampa i dati del membro eliminato
function printDetails(member) {
  var e = db({discordID:member.id}).first();
  var t = "Il membro <@" + member.id + "> è stato rimosso.\n"
  t += "**Telegram:** " + e.telegram + "\t\t**Note:** " + e.notes;
  channelBotG.send(t);
}

client.on("ready", () => {
  console.log("Bot avviato.");
  guildG = client.guilds.find("name", "Italian Drifters");
  channelBotG = guildG.channels.find("name", "azir_bot");
  loadMembers();
});

client.on("guildMemberRemove", (member) => {
    printDetails(member);
    db({discordID:member.id}).remove();
    saveMembers();
});

client.on("message", message => {
  //Richieste del bot
  if(functionBotID != 0 && message.channel.name == "azir_bot" && message.author.username != "Azir Bot") {
    switch(functionBotID) {
      //Inserimento dati per il membro aggiunto
      case 1:
        var args = message.content.split("-");
        db.insert({discordID:nMember.id,type:getMemberType(nMember),discord:nMember.user.username,telegram:args[0],notes:args[1]});
        db.sort("type desc");
        channelBotG.send("Utente aggiunto.");
        saveMembers();
        break;
      case 2:
        var m = message.content;
        if(m == "null") {
          m = "";
        }
        db({discordID:nMember.id}).update({telegram:m});
        channelBotG.send("Telegram aggiornato.");
        saveMembers();
        break;
      case 3:
        var m = message.content;
        if(m == "null") {
          m = "";
        }
        db({discordID:nMember.id}).update({notes:m});
        channelBotG.send("Note aggiornate.");
        saveMembers();
        break;
      case 4:
        var m = message.content;
        db({telegram:m}).remove();
        channelBotG.send("Utente Telegram eliminato.");
        saveMembers();
        break;
    }
    functionBotID = 0;
  }

  //Elenco comandi
  if(message.content.startsWith("!")) {
    var args = message.content.split(" ", 1);
    var cmd = args[0];
    var par = message.content.substring(cmd.length + 1);
    //Comandi amministratori
    if(message.channel.name == "azir_bot") {
      switch(cmd) {
        case "!help":
          var t = "";
          t += "`Azir Bot - Versione " + version + "`\n\n";

          t += "Elenco dei comandi disponibili:\n";
          t += "+) **!add @nomeutente**: aggiunge un utente all'elenco.\n";
          t += "+) **!delete @nomeutente**: elimina un utente all'elenco.\n";
          t += "+) **!setTelegram @nomeutente**: imposta il Telegram di un utente nell'elenco.\n";
          t += "+) **!setNotes @nomeutente**: imposta le note di un utente nell'elenco.\n";
          t += "+) **!showDiscord**: mostra l'elenco degli utenti relativo al Discord.\n";
          t += "+) **!showTelegram**: mostra l'elenco degli utenti relativo a Telegram.\n";

          t += "***NOTE:***\n";
          t += "+) Per il corretto funzionamento del Bot, rispettare gli spazi tra le parole e inserire i nomi in modo appropiato.";

          message.channel.send(t);
          t = "";

          t += "***ISTRUZIONI:***\n";
          t += "Quando un utente viene inserito nel ruolo *Membri* per essere abilitato al server, il Bot chiederà automaticamente\n";
          t += "di inserire il nome Telegram dell'utente (se presente nel gruppo) ed eventuali note.\n";
          t += "Queste due informazioni vanno scritte in un messaggio nel canale *#azir_bot* separate da un trattino.\n";
          t += "Se non si vuole aggiungere nessuna informazione, scrivere semplicemente il trattino per lasciare vuoti i campi.\n";
          t += "Se si vuole lasciare vuoto un campo tramite *!setTelegram* e/o *!setNotes*, scrivere *null* quando viene richiesta l'informazione.\n\n";

          t += "I comandi *!add*, *!delete*, *!setTelegram* e *!setNotes* richiedono che l'utente in questione venga menzionato\n";
          t += "tramite il simbolo @ affinché la funzione possa svolgere il suo compito correttamente.\n";
          t += "Poiché non è possibile menzionare direttamente i membri all'interno del canale *#azir_bot*\n";
          t += "tramite il simbolo @ (ovvero gli unici utenti menzionabili sono gli amministratori), esistono due procedere alternative:\n";
          t += "+) Utilizzare il comando *!show*, tasto destro sul tag del membro e cliccare su *Menziona*\n";
          t += "+) Menzionare l'utente in un canale testuale pubblico per poi copiare il contenuto nel canale *#azir_bot*\n\n";

          t += "Se si vuole aggiungere un membro appartenente solo a Telegram, menzionare l'utente su Discord *UtenteTelegram*.\n";
          t += "I membri presenti soltanto sul gruppo Telegram possono essere visualizzati soltanto col comando *!showTelegramOnly*.\n";
          t += "Per eliminare un membro Telegram, menzionare l'utente su Discord *UtenteTelegram* e specificare successivamente il nome.";

          message.channel.send(t);
          break;
        case "!add":
          var m = getMember(par);
          if(m != undefined) {
            requestDetails(m);
          }
          else
          {
            channelBotG.send("Nome utente erratto.");
          }
          break;
        case "!delete":
          var m = getMember(par);
          if(m != undefined) {
            if(m.user.username == "UtenteTelegram") {
                channelBotG.send("Invia un messaggio per specificare l'utente Telegram da eliminare.");
                functionBotID = 4;
            }
            else
            {
                printDetails(m);
                db({discordID:m.id}).remove();
                saveMembers();
            }
          }
          else
          {
            channelBotG.send("Nome utente erratto.");
          }
          break;
        case "!setTelegram":
          nMember = getMember(par);
          if(nMember != undefined) {
            channelBotG.send("Invia un messaggio per impostare il Telegram di <@" + nMember.id + ">");
            functionBotID = 2;
          }
          else
          {
            channelBotG.send("Nome utente erratto.");
          }
          break;
        case "!setNotes":
          nMember = getMember(par);
          if(nMember != undefined) {
            channelBotG.send("Invia un messaggio per impostare le note di <@" + nMember.id + ">");
            functionBotID = 3;
          }
          else
          {
            channelBotG.send("Nome utente erratto.");
          }
          break;
        case "!showDiscord":
          message.channel.send("```Elenco Utenti (Discord)```\n");
          message.channel.send("```Legenda:\n⭐ - Founder\n✦ - Admin\n✪ - Tecnico\n★ - Membro\n☆ - Ospite```\n");
          var i = 0; var j = 0;
          var t = "```Markdown\n#Pag. 0```\n"; 
          db().each(function(r) {
            if(r.discord != "UtenteTelegram") {
              var symbol;
              switch(r.type) {
                case 0: symbol = "☆"; break;
                case 1: symbol = "★"; break;
                case 2: symbol = "✪"; break;
                case 3: symbol = "✦"; break;
                case 4: symbol = "⭐"; break;
              }
              symbol += "| ";
              t += symbol + "**Discord:** <@" + r.discordID + ">\t\t**Telegram:** " + r.telegram + "\t\t**Note:** " + r.notes + "\n";
              i++;
              if(i == 10) {
                message.channel.send(t);
                j++;
                t = "```Markdown\n#Pag . " + j + "```\n"; i = 0;
              }
            }
          });
          message.channel.send(t + "\n```Fine elenco.```");
          break;
        case "!showTelegram":
          message.channel.send("```Elenco Utenti (Telegram)```\n\n");
          var i = 0; var j = 0;
          var t = "```Markdown\n#Pag. 0```\n"; 
          db().each(function(r) {
            if(r.telegram != "") {
              var showDiscord;
              if(r.discord == "UtenteTelegram") {
                showDiscord = "<nessuno>";
              }
              else
              {
                showDiscord = "<@" + r.discordID + ">";
              }
              t += "**Telegram:** " + r.telegram + "\t\t**Discord:** " + showDiscord + "\t\t**Note:** " + r.notes + "\n"
              i++;
              if(i == 10) {
                message.channel.send(t);
                j++;
                t = "```Markdown\n#Pag . " + j + "```\n"; i = 0;
              }
            }
          });
          message.channel.send(t + "\n```Fine elenco.```");
          break;
        //Comandi nascosti
        case "!loadMembers":
          loadMembers();
          break; 
        case "!saveMembers":
          saveMembers();
          break; 
        case "!upMembers":
          var c;
          c = guildG.roles.find("name", "Founder").members;
          c.forEach(function(par, key) {
            var m = guildG.members.get(key);
            db.insert({discordID:m.id,type:4,discord:m.user.username,telegram:"",notes:""});
          });
          c = guildG.roles.find("name", "Admin").members;
          c.forEach(function(par, key) {
            var m = guildG.members.get(key);
            db.insert({discordID:m.id,type:3,discord:m.user.username,telegram:"",notes:""});
          });
          c = guildG.roles.find("name", "Tecnico").members;
          c.forEach(function(par, key) {
            var m = guildG.members.get(key);
            db.insert({discordID:m.id,type:2,discord:m.user.username,telegram:"",notes:""});
          });
          c = guildG.roles.find("name", "Membri").members;
          c.forEach(function(par, key) {
            var m = guildG.members.get(key);
            db.insert({discordID:m.id,type:1,discord:m.user.username,telegram:"",notes:""});
          });
          c = guildG.roles.find("name", "Ospiti").members;
          c.forEach(function(par, key) {
            var m = guildG.members.get(key);
            db.insert({discordID:m.id,type:0,discord:m.user.username,telegram:"",notes:""});
          });
          db.sort("type desc");
          message.channel.send("Membri caricati.");
          break;
      }
    }
    //Comandi utenti
    else {
      switch(cmd) {
        case "!help":
          var t = "";
          t += "`Azir Bot - Versione " + version + "`\n\n";

          t += "Elenco dei comandi disponibili:\n";
          t += "+) **!help**: mostra l'elenco dei comandi.\n";
          t += "+) **!pizza**: joke del Bot.\n";
          t += "+) **!insulta1 @nomeutente**: insulta utente con una frase preimpostata (n° 1).\n";
          t += "+) **!insulta2 @nomeutente**: insulta utente con una frase preimpostata (n° 2).\n";
          t += "+) **!insulta3 @nomeutente**: insulta utente con una frase preimpostata (n° 3).\n\n";

          t += "***NOTE:***\n";
          t += "+) E' vietato lo spam di tali comandi, pena il disabilitamento del Bot.\n";
          t += "+) Per il corretto funzionamento del Bot, rispettare gli spazi tra le parole e inserire i nomi in modo appropiato.";
          message.channel.send(t);
          break;
        case "!pizza":
          message.channel.send("Sono un imperatore io, non un porta pizze!", {tts: true});
          break;
        case "!insulta1":
          message.channel.send(par + ", sei un pirla.", {tts: true});
          break;
        case "!insulta2":
          message.channel.send(par + ", tua madre è una bagascia.", {tts: true});
          break;
        case "!insulta3":
          message.channel.send(par + ", sei più inutile di Antonio.", {tts: true});
          break;
      }
    }  
  }
});

client.login("MzA5NzE2NTA2MjQ0MDIyMjc0.C-zhHQ.Iy8SszSSySS8i__EgWn-nsLth7c");