//Libreria Date
var moment = require("moment");
moment().format();
//Proprietà server
const Discord = require("discord.js");
const client = new Discord.Client();
var guildG = new Discord.Guild();
var channelBotG = new Discord.Channel();
var channelUsersG = new Discord.Channel();
var channelAdminG = new Discord.Channel();
var channelSalottoG = new Discord.Channel();
var channelNormal1G = new Discord.Channel();
var channelNormal2G = new Discord.Channel();
var channelNormal3G = new Discord.Channel();
var channelNormal4G = new Discord.Channel();
var channelNormal5G = new Discord.Channel();
var movePlayers = false;
//Database
TAFFY = require("taffy");
var db = TAFFY([]);   //Utenti
var gg = new (require("op.gg-api/client.js"));
const fs = require("fs");
var request = require("request");
//Inserimento membro
var functionBotID = 0;
var nMember;
//Informazioni generali
var version = "0.4 (Beta)";
var botEnabledForUsers = true;

//Salva il database in un file
function saveUsers() {
  fs.writeFile("./data/elenco.json", db().stringify(), (err) => {
    if (err) {
      console.error(err);
    } 
  });
}

//Carica il database dal file
function loadUsers() {
  var dbFile = JSON.parse(fs.readFileSync("./data/elenco.json", "utf8"));
  for (var key in dbFile) {
    if (dbFile.hasOwnProperty(key)) {
      db.insert({discordID:dbFile[key].discordID,type:dbFile[key].type,username:dbFile[key].username,telegram:dbFile[key].telegram,notes:dbFile[key].notes,ultimoAccesso:dbFile[key].ultimoAccesso});
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

//Restituisce tipo di membro
function getMemberType(m) {
  var h = m.highestRole.name;
  var n;
  switch(h) {
    case "Ospiti": n = 0; break;
    case "Membri": n = 1; break;
    case "Moderatori": n = 2; break;
    case "Admin": n = 3; break;
    case "Founder": n = 4; break;
    //Eccezioni
    case "Poeta <3": n = 3; break;
    case "L'inutile perenne": n = 1; break;
  }
  return n;
}

//Ottiene data del giorno corrente
function getCurrentDate() {
  var data = new Date();
  var giorno = data.getDate();
  var mese = data.getMonth() + 1;
  var anno = data.getFullYear();
  var t = giorno + "/" + mese + "/" + anno;
  return t;
}

//Stampa i dati del membro qualora viene aggiunto/eliminatio
function printDetails(member, actionID) {
  var e = db({discordID:member.id}).first();
  var t = "";
  if(actionID == 0) {
    t += "L'utente <@" + member.id + "> è stato rimosso.\n"
    if(e.telegram != "") {
      t += "**Telegram:** " + e.telegram + "\n";
    }
    if(e.notes != "") {
      t += "**Note:** " + e.notes + "\n";
    }
  }
  else 
  {
    t += "L'utente <@" + member.id + "> è stato aggiunto.\n"
  }
  channelBotG.send(t);
}

//Avvio bot
client.on("ready", () => {
  console.log("Bot avviato.");
  guildG = client.guilds.find("name", "Italian Drifters");
  channelBotG = guildG.channels.find("name", "azir_bot");
  channelUsersG = guildG.channels.find("name", "hall");
  channelAdminG = guildG.channels.find("name", "admin");
  channelSalottoG = guildG.channels.find("name", "Salotto");
  channelNormal1G = guildG.channels.find("name", "Normal #1");
  channelNormal2G = guildG.channels.find("name", "Normal #2");
  channelNormal3G = guildG.channels.find("name", "Normal #3");
  channelNormal4G = guildG.channels.find("name", "Normal #4");
  channelNormal5G = guildG.channels.find("name", "Normal #4");
  loadUsers();
});

//Se l'utente viene rimosso da Discord viene eliminato anche dalla lista
client.on("guildMemberRemove", (member) => {
  printDetails(member, 0);
  db({discordID:member.id}).remove();
});

//Aggiunge l'utente in automatico alla lista ospiti
client.on("guildMemberAdd", (member) => {
  var ospiti = guildG.roles.find("name", "Ospiti");
  member.addRole(ospiti);
  db.insert({discordID:member.id,type:0,username:member.user.username,telegram:"",notes:"",ultimoAccesso:getCurrentDate()});
  //db.sort("type desc");
  printDetails(member, 1);
});

//Aggiorna la data di ultimo accesso di ogni utente
client.on("voiceStateUpdate", (oldMember, newMember) => {
  if(newMember.voiceChannelID == null) {
    db({discordID:newMember.id}).update({ultimoAccesso:getCurrentDate()});
  }
});


client.on("presenceUpdate", (oldMember, newMember) => {
  //Comandi automatici del server, eseguiti all'accesso di un admin specifico
  if(newMember.user.username == "Drekkar" && newMember.presence.status == "online") {
    //Controlla gli accessi degli Ospiti e caccia quelli che non si attivano da più di due settimane
    var b = moment(getCurrentDate(), "DD-MM-YYYY");
    db({type:0}).each(function(r) {
      var a = moment(r.ultimoAccesso, "DD-MM-YYYY")
      var c = b.diff(a, "days");
      if(c > 14) {
        var m = guildG.members.get(r.discordID);
        m.kick("Ospite inattivo per più di 14 giorni.");
      }
    });
    saveUsers();
  }

  //Sposta dal Salotto tutte le persone che sono in gioco e le sposta in un canale apposito
  if(newMember.presence.game != null && newMember.voiceChannel != null) {
    if(newMember.presence.game.name == "League of Legends" && newMember.voiceChannel.name == "Salotto" && !movePlayers) {
      movePlayers = true;
      var c = new Discord.Channel();
      if(Array.from(channelNormal1G.members).length == 0) {
        c = channelNormal1G;
      }
      else if(Array.from(channelNormal2G.members).length == 0) {
        c = channelNormal2G;
      }
      else if(Array.from(channelNormal3G.members).length == 0) {
        c = channelNormal3G;
      } 
      else if(Array.from(channelNormal4G.members).length == 0) {
        c = channelNormal4G;
      }
      else if(Array.from(channelNormal4G.members).length == 0) {
        c = channelNormal5G;
      }

      setTimeout(function() {
        channelSalottoG.members.forEach(function(par, key) {
          var m = guildG.members.get(key);
          if(m.presence.game != null) {
            if(m.presence.game.name == "League of Legends") {
              m.setVoiceChannel(c);
            }
          }
        });
        movePlayers = false;
      }, 5000);
    }
  }
});

client.on("guildMemberUpdate", (oldMember, newMember) => {
  if(oldMember.highestRole != newMember.highestRole) 
  {
    //Aggiorna il tipo di membro
    db({discordID:newMember.id}).update({type:getMemberType(newMember)});

    if(newMember.highestRole.name != "Ospiti" && newMember.highestRole.name != "@everyone") {
      var t = "";
      switch(newMember.highestRole.name) {
        //Invia un messaggio di benvenuto ai nuovi Membri
        case "Membri":
          t += "**Benvenuto negli Italian Drifters, <@" + newMember.id + ">!**\n\n";

          t += "Siamo felici che tu ti sia unito alla nostra community e ci auguriamo che la tua esperienza sarà piacevole qui con noi.\n";
          t += "Per facilitarti nell'integrazione al nostro gruppo ecco un paio di punti che ti invitiamo a leggere.\n\n";

          t += "**IL REGOLAMENTO**\n";
          t += "Nella chat testuale #regolamento troverai una serie di messaggi che spiegano il funzionamento del server e riportano le regole da seguire per garantire una buona convivenza nel gruppo. Leggile con attenzione e rivolgiti ad un Admin o Moderatore se hai bisogno di maggiori chiarimenti.\n\n";

          t += "**COME FACCIO A STRINGERE AMICIZIA?**\n";
          t += "Se sei una persona timida, sei un nuovo arrivato e sei alle prime armi con una community del genere, non devi preoccuparti: lo Staff contatta personalmente i recenti iscritti per giocare insieme e aiutarli a stringere amicizia.\n";
          t += "Puoi anche chiedere - nella chat testuale #hall o girando nelle varie stanze vocali - se qualcuno è disponibile a fare una partita, con un pochino di pazienza troverai nuovi compagni con cui giocare.\n";
          t += "Capita inoltre a volte che altri ragazzi hanno dei posti liberi nella lobby e domandano - sulla #hall o sulla chat Telegram - chi abbia voglia di unirsi, quindi rimani sintonizzato.\n\n";

          t += "**POSSO TROVARE UN COMPAGNO DI RANKED?**\n";
          t += "Certo! Nel server potrai trovare giocatori di tutti gli Elo - dal Bronzo fino al Diamante - disposti a fare sia Solo/Duo sia Flex, l'importante è dimostrare di essere socievoli con gli altri e partecipare alla vita della community.\n\n"
          
          t += "**ORGANIZZATE EVENTI?**\n";
          t += "Si, al momento il server si sta impegnando nell'organizzazione di tornei di vario tipo inerenti a League of Legends e non, quindi tieni d'occhio il canale #avvisi!\n\n";
          
          t += "Questo è tutto!\n";
          t += "**Buona permanenza!**\n";
          break;
      }
      newMember.send(t);
    }
  }
});

client.on("message", message => {
  //Richieste del bot
  if(functionBotID != 0 && message.channel.name == "azir_bot" && message.author.username != "Azir Bot") {
    switch(functionBotID) {
      //Inserimento dati per il membro aggiunto
      case 1:
        var m = message.content;
        if(m == "null") {
          m = "";
        }
        db({discordID:nMember.id}).update({username:m});
        channelBotG.send("Username aggiornato.");
        break;
      case 2:
        var m = message.content;
        if(m == "null") {
          m = "";
        }
        db({discordID:nMember.id}).update({telegram:m});
        channelBotG.send("Telegram aggiornato.");
        break;
      case 3:
        var m = message.content;
        if(m == "null") {
          m = "";
        }
        db({discordID:nMember.id}).update({notes:m});
        channelBotG.send("Note aggiornate.");
        break;
    }
    functionBotID = 0;
  }

  //Elenco comandi
  if(message.content.startsWith("!")) {
    var args = message.content.split(" ", 1);
    var cmd = args[0];
    var par = message.content.substring(cmd.length + 1);
    ////Comandi amministratori
    if(message.channel.name == "azir_bot") {
      switch(cmd) {
        case "!help": //Mostra i comandi
          var t = "";
          t += "`Azir Bot - Versione " + version + "`\n\n";

          t += "Elenco dei comandi disponibili:\n";
          t += "+) **!showDiscord**: mostra l'elenco degli utenti relativo al Discord.\n";
          t += "+) **!showTelegram**: mostra l'elenco degli utenti relativo a Telegram.\n";
          t += "+) **!setUsername @tag**: imposta il nome di un utente nell'elenco (non cambierà il suo nome su Discord).\n";
          t += "+) **!setTelegram @tag**: imposta il Telegram di un utente nell'elenco.\n";
          t += "+) **!setNotes @tag**: imposta le note di un utente nell'elenco.\n";
          t += "+) **!enableForUsers**: abilita/disabilita i comandi del Bot per gli utenti.\n";

          t += "***NOTE:***\n";
          t += "+) Per il corretto funzionamento del Bot, rispettare gli spazi tra le parole e inserire i nomi in modo appropiato.";

          message.channel.send(t);
          t = "";

          t += "***ISTRUZIONI:***\n";
          t += "I comandi *!setUsername*, *!setTelegram* e *!setNotes* richiedono che l'utente in questione venga menzionato\n";
          t += "tramite il simbolo @ affinché la funzione possa svolgere il suo compito correttamente.\n";
          t += "Poiché non è possibile menzionare direttamente i membri all'interno del canale *#azir_bot*\n";
          t += "tramite il simbolo @ (ovvero gli unici utenti menzionabili sono gli amministratori), esistono due procedere alternative:\n";
          t += "+) Utilizzare il comando *!show*, tasto destro sul Tag dell'utente e cliccare su *Menziona*\n";
          t += "+) Menzionare l'utente in un canale testuale pubblico per poi copiare il contenuto nel canale *#azir_bot*\n\n";

          message.channel.send(t);
          break;
        case "!setUsername": //Imposta l'username di un utente
          nMember = getMember(par);
          if(nMember != undefined) {
            channelBotG.send("Invia un messaggio per impostare l'Username di <@" + nMember.id + ">");
            functionBotID = 1;
          }
          else
          {
            channelBotG.send("Tag erratto.");
          }
          break;
        case "!setTelegram": //Imposta il Telegram di un utente
          nMember = getMember(par);
          if(nMember != undefined) {
            channelBotG.send("Invia un messaggio per impostare il Telegram di <@" + nMember.id + ">");
            functionBotID = 2;
          }
          else
          {
            channelBotG.send("Tag erratto.");
          }
          break; 
        case "!setNotes": //Imposta le note di un utente
          nMember = getMember(par);
          if(nMember != undefined) {  
            channelBotG.send("Invia un messaggio per impostare le note di <@" + nMember.id + ">");
            functionBotID = 3;
          }
          else
          {
            channelBotG.send("Tag erratto.");
          }
          break;
        case "!showDiscord":  //Mostra l'elenco degli utenti in base al Discord
          message.channel.send("```Elenco Utenti (Discord)```\n");
          message.channel.send("```Legenda:\n⭐ - Founder\n✦ - Admin\n✪ - Moderatore\n★ - Membro\n☆ - Ospite```\n");
          var i = 0; var j = 0;
          var t = "```Markdown\n#Pag. 0```\n"; 
          db().order("type desc, username logical").each(function(r) {
            if(r.username != "UtenteTelegram") {
              var symbol;
              switch(r.type) {
                case 0: symbol = "☆"; break;
                case 1: symbol = "★"; break;
                case 2: symbol = "✪"; break;
                case 3: symbol = "✦"; break;
                case 4: symbol = "⭐"; break;
              }
              symbol += "| ";
              t += symbol + "**Username:** " + r.username
              if(r.telegram != "") {
                t += "\t\t**Telegram:** " + r.telegram;
              }
              if(r.notes != "") {
                t += "\t\t**Note:** " + r.notes;
              }
              t += "\t\t**Tag:** <@" + r.discordID + ">\t\t**Ultimo accesso:** " + r.ultimoAccesso + "\n";
              i++;
              if(i == 10) {
                message.channel.send(t);
                j++;
                t = "```Markdown\n#Pag. " + j + "```\n"; i = 0;
              }
            }
          });
          message.channel.send(t + "\n```Fine elenco.```");
          break;
        case "!showTelegram": //Mostra l'elenco degli utenti in base al Telegram
          message.channel.send("```Elenco Utenti (Telegram)```\n\n");
          var i = 0; var j = 0;
          var t = "```Markdown\n#Pag. 0```\n"; 
          db().order("telegram logical").each(function(r) {
            if(r.telegram != "") {
              t += "**Telegram:** " + r.telegram;
              if(r.notes != "")
              {
                t += "\t\t**Note:** " + r.notes;
              }
              if(r.username != "UtenteTelegram") {
                t += "\t\t**Discord:** <@" + r.discordID + ">";
              }
              t += "\n";
              i++;
              if(i == 10) {
                message.channel.send(t);
                j++;
                t = "```Markdown\n#Pag. " + j + "```\n"; i = 0;
              }
            }
          });
          message.channel.send(t + "\n```Fine elenco.```");
          break;
        case "!enableForUsers": //Abilita/disabilita i comandi del Bot per gli utenti
          if(botEnabledForUsers) {
            botEnabledForUsers = false;
            channelBotG.send("Comandi del bot disabilitati per gli utenti.");
            channelUsersG.send("I comandi del bot sono stati disabilitati.");
          }
          else
          {
            botEnabledForUsers = true;
            channelBotG.send("Comandi del bot abilitati per gli utenti.");
            channelUsersG.send("I comandi del bot sono stati abilitati.\nEvitate lo spam, grazie.");
          }
          break;
        ////Comandi nascosti
        case "!loadUsers": 
          loadUsers();
          message.channel.send("Utenti caricati.");
          break; 
        case "!saveUsers":
          saveUsers();
          message.channel.send("Utenti salvati.");
          break; 
        case "!upUsers":
          db().remove();
          var d = getCurrentDate();
          guildG.members.forEach(function(par, key) {
            var m = guildG.members.get(key);
            db.insert({discordID:m.id,type:getMemberType(m),username:m.user.username,telegram:"",notes:"",ultimoAccesso:d});
          });
          message.channel.send("Utenti caricati.");
          break;
      }
    }
    ////Comandi utenti
    else {
      if(botEnabledForUsers && message.member.highestRole.name != "Ospiti") {
        switch(cmd) {
          case "!help": //Mostra i comando
            var t = "";
            t += "`Azir Bot - Versione " + version + "`\n\n";

            t += "Elenco delle funzionalità disponibili:\n\n";

            t += "**COMANDI IN CHAT**\n";
            t += "Scrivere uno di questi comandi nella chat testuale #hall:\n";
            t += "+) **!help**: mostra l'elenco dei comandi.\n";
            t += "+) **!sos**: invia una richiesta d'aiuto allo Staff.\n";
            t += "+) **!pizza**: joke del Bot.\n";
            t += "+) **!insulta @tag**: insulta utente con una frase scelta casualmente tra cinque preimpostate.\n";
            t += "+) **!dice**: lancia un dado a sei faccie.\n";

            t += "***NOTE:***\n";
            t += "+) E' vietato lo spam di tali comandi, pena il disabilitamento del Bot.\n";
            t += "+) Per il corretto funzionamento del Bot, rispettare gli spazi tra le parole e inserire i nomi in modo appropiato.";
            message.channel.send(t);
            break;
          case "!sos": //Manda un messaggio di aiuto
            var t = "Messaggio per lo Staff.\nIl membro <@" + message.author.id + "> ha bisogno di aiuto.";
            channelUsersG.send(t, {tts: true});
            channelAdminG.send(t, {tts: true});
            break;
          case "!pizza": //Joke del Bot
            message.channel.send("Sono un imperatore io, non un porta pizze!", {tts: true});
            break;
          case "!insulta": //Insulta una persona
            if(par.startsWith("<@")) {
              var r = Math.floor((Math.random() * 5) + 1);
              var t = "";
              par = par.split(" ", 1);
              switch(r) {
                case 1: t = par + ", sei un pirla."; break;
                case 2: t = par + ", tua madre è una bagascia."; break;
                case 3: t = par + ", sei più inutile di MeLoSushi."; break;
                case 4: t = par + ", brutta scimmia boostata che non sei altro, vedi di sparire dalla circolazione."; break;
                case 5: t = par + ", fai più pippe te o IL FAPPONE?"; break;
              }
              message.channel.send(t, {tts: true});
            }
            else
            {
              message.channel.send("Comando non valido.");
            }
            break;
          case "!dice": //Lancia un dando a sei faccie
            var r = Math.floor((Math.random() * 6) + 1);
            message.channel.send("Dado: " + r);
            break;
        }
      }
    }  
  }
});

client.login("MzA5NzE2NTA2MjQ0MDIyMjc0.C-zhHQ.Iy8SszSSySS8i__EgWn-nsLth7c");