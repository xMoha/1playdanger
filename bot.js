
const Discord = require("discord.js");
const ytdl = require("ytdl-core");
const { Client, Util } = require('discord.js');
const getYoutubeID = require('get-youtube-id');
const fetchVideoInfo = require('youtube-info');
const YouTube = require('simple-youtube-api');
const youtube = new YouTube("AIzaSyAdORXg7UZUo7sePv97JyoDqtQVi3Ll0b8");
const queue = new Map();
const client = new Discord.Client();
const prefix = 'T'

/*
packages:
npm install discord.js
npm install ytdl-core
npm install get-youtube-id
npm install youtube-info
npm install simple-youtube-api
npm install queue
*/

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    console.log(`in ${client.guilds.size} servers `)
    console.log(`[Codes] ${client.users.size}`)
    client.user.setStatus("dnd")
});

const prefix = "1"
client.on('message', async msg => { 
	
	if (msg.author.bot) return undefined;

	if (!msg.content.startsWith(prefix)) return undefined;
	const args = msg.content.split(' ');
	const searchString = args.slice(1).join(' ');

	const url = args[1] ? args[1].replace(/<(.+)>/g, '$1') : '';
	const serverQueue = queue.get(msg.guild.id);
	
	let command = msg.content.toLowerCase().split(" ")[0];
	command = command.slice(prefix.length)
	
	if (command === `play`) {
		const voiceChannel = msg.member.voiceChannel;
		if (!voiceChannel) return msg.channel.send('You should be in a voice channel');
		const permissions = voiceChannel.permissionsFor(msg.client.user);
		if (!permissions.has('CONNECT')) {
			//by ,$ ReBeL Ø¡ , ðŸ”•#4777 'CODES SERVER'
			return msg.channel.send('i have no perms to get in this room');
		}//by ,$ ReBeL Ø¡ , ðŸ”•#4777 'CODES SERVER'
		if (!permissions.has('SPEAK')) {
			return msg.channel.send('i have no perms to speak in this room');
		}//by ,$ ReBeL Ø¡ , ðŸ”•#4777 'CODES SERVER'

		if (!permissions.has('EMBED_LINKS')) {
			return msg.channel.sendMessage("**i should have `EMBED LINKS` perm**")
		}

		if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
			const playlist = await youtube.getPlaylist(url);
			const videos = await playlist.getVideos();
			//by ,$ ReBeL Ø¡ , ðŸ”•#4777 'CODES SERVER'
			for (const video of Object.values(videos)) {
				const video2 = await youtube.getVideoByID(video.id); // eslint-disable-line no-await-in-loop
				await handleVideo(video2, msg, voiceChannel, true); // eslint-disable-line no-await-in-loop
			}
			return msg.channel.send(` **${playlist.title}** added to the list`);
		} else {
			try {

				var video = await youtube.getVideo(url);
			} catch (error) {
				try {
					var videos = await youtube.searchVideos(searchString, 5);
					let index = 0;
					const embed1 = new Discord.RichEmbed()
			        .setDescription(`**Choose a number** :
${videos.map(video2 => `[**${++index} **] \`${video2.title}\``).join('\n')}`)

					.setFooter("Brix")
					msg.channel.sendEmbed(embed1).then(message =>{message.delete(20000)})
					
					// eslint-disable-next-line max-depth
					try {
						var response = await msg.channel.awaitMessages(msg2 => msg2.content > 0 && msg2.content < 11, {
							maxMatches: 1,
							time: 15000,
							errors: ['time']
						});
					} catch (err) {
						console.error(err);
						return msg.channel.send('you did not choose a number');
					}
					const videoIndex = parseInt(response.first().content);
					var video = await youtube.getVideoByID(videos[videoIndex - 1].id);
				} catch (err) {
					console.error(err);
					return msg.channel.send('i can not find search result');
				}
			}

			return handleVideo(video, msg, voiceChannel);
		}
	} else if (command === `skip`) {
		if (!msg.member.voiceChannel) return msg.channel.send('you are not in a voice channel');
		if (!serverQueue) return msg.channel.send('there is no thing to skip');
		serverQueue.connection.dispatcher.end('skepped');
		return undefined;
	} else if (command === `stop`) {
		
		if (!msg.member.voiceChannel) return msg.channel.send('you are not in a voice channel');
		if (!serverQueue) return msg.channel.send('there is no thing to stop');
		serverQueue.songs = [];
		serverQueue.connection.dispatcher.end('stopped');
		return undefined;
	} else if (command === `vol`) {
		if (!msg.member.voiceChannel) return msg.channel.send('you are not in a voice channel');
		if (!serverQueue) return msg.channel.send('there is no thing playing');
		if (!args[1]) return msg.channel.send(`:loud_sound: volume **${serverQueue.volume}**`);
		serverQueue.volume = args[1];
		
		serverQueue.connection.dispatcher.setVolumeLogarithmic(args[1] / 50);
		return msg.channel.send(`:speaker: ØªÙ… ØªØºÙŠØ± Ø§Ù„ØµÙˆØª Ø§Ù„ÙŠ **${args[1]}**`);
	} else if (command === `np`) {
		if (!serverQueue) return msg.channel.send('there is no thing playing');
		const embedNP = new Discord.RichEmbed()
	.setDescription(`:notes: playing : **${serverQueue.songs[0].title}**`)
		return msg.channel.sendEmbed(embedNP);
	} else if (command === `queue`) {
		
		if (!serverQueue) return msg.channel.send('there is no thing playing');
		let index = 0;
		
		const embedqu = new Discord.RichEmbed()

.setDescription(`**Songs Queue**
${serverQueue.songs.map(song => `**${++index} -** ${song.title}`).join('\n')}
**now playing** ${serverQueue.songs[0].title}`)
		return msg.channel.sendEmbed(embedqu);
	} else if (command === `pause`) {
		if (serverQueue && serverQueue.playing) {
			serverQueue.playing = false;
			serverQueue.connection.dispatcher.pause();
			return msg.channel.send('paused');
		}
		return msg.channel.send('there is no thing playing');
	} else if (command === "resume") {
		if (serverQueue && !serverQueue.playing) {
			serverQueue.playing = true;
			serverQueue.connection.dispatcher.resume();
			return msg.channel.send('resumed');
		}
		return msg.channel.send('there is no thing playing');
	}

	return undefined;
});

async function handleVideo(video, msg, voiceChannel, playlist = false) {
	const serverQueue = queue.get(msg.guild.id);
	console.log(video);
//	console.log('yao: ' + Util.escapeMarkdown(video.thumbnailUrl));
	const song = {
		id: video.id,
		title: Util.escapeMarkdown(video.title),
		url: `https://www.youtube.com/watch?v=${video.id}`
	};
	if (!serverQueue) {
		const queueConstruct = {
			textChannel: msg.channel,
			voiceChannel: voiceChannel,
			connection: null,
			songs: [],
			volume: 5,
			playing: true
		};
		queue.set(msg.guild.id, queueConstruct);

		queueConstruct.songs.push(song);

		try {
			var connection = await voiceChannel.join();
			queueConstruct.connection = connection;
			play(msg.guild, queueConstruct.songs[0]);
		} catch (error) {
			console.error(`I could not join the voice channel: ${error}`);
			queue.delete(msg.guild.id);
			return msg.channel.send(`i can not get in this room ${error}`);
		}
	} else {
		serverQueue.songs.push(song);
		console.log(serverQueue.songs);
		if (playlist) return undefined;
		else return msg.channel.send(` **${song.title}** added to the list`);
	}
	return undefined;
}

function play(guild, song) {
	const serverQueue = queue.get(guild.id);

	if (!song) {
		serverQueue.voiceChannel.leave();
		queue.delete(guild.id);
		return;
	}
	console.log(serverQueue.songs);

	const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
		.on('end', reason => {
			if (reason === 'Stream is not generating quickly enough.') console.log('Song ended.');
			else console.log(reason);
			serverQueue.songs.shift();
			play(guild, serverQueue.songs[0]);
		})
		.on('error', error => console.error(error));
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);

	serverQueue.textChannel.send(`start playing : **${song.title}**`);
}

const adminprefix = "$vip";
const devs = ['274923685985386496'];
client.on('message', message => {
  var argresult = message.content.split(` `).slice(1).join(' ');
    if (!devs.includes(message.author.id)) return;
    
if (message.content.startsWith(adminprefix + 'setgame')) {
  client.user.setGame(argresult);
    message.channel.sendMessage(`**${argresult} ØªÙ… ØªØºÙŠÙŠØ± Ø¨Ù„Ø§ÙŠÙ†Ù‚ Ø§Ù„Ø¨ÙˆØª Ø¥Ù„Ù‰ **`)
} else 
  if (message.content.startsWith(adminprefix + 'setname')) {
client.user.setUsername(argresult).then
    message.channel.sendMessage(`**${argresult}** : ØªÙ… ØªØºÙŠÙŠØ± Ø£Ø³Ù… Ø§Ù„Ø¨ÙˆØª Ø¥Ù„Ù‰`)
return message.reply("**Ù„Ø§ ÙŠÙ…ÙƒÙ†Ùƒ ØªØºÙŠÙŠØ± Ø§Ù„Ø§Ø³Ù… ÙŠØ¬Ø¨ Ø¹Ù„ÙŠÙƒ Ø§Ù„Ø§Ù†ØªØ¸Ø¢Ø± Ù„Ù…Ø¯Ø© Ø³Ø§Ø¹ØªÙŠÙ† . **");
} else
  if (message.content.startsWith(adminprefix + 'setavatar')) {
client.user.setAvatar(argresult);
  message.channel.sendMessage(`**${argresult}** : ØªÙ… ØªØºÙŠØ± ØµÙˆØ±Ø© Ø§Ù„Ø¨ÙˆØª`);
      } else     
if (message.content.startsWith(adminprefix + 'setT')) {
  client.user.setGame(argresult, "https://www.twitch.tv/idk");
    message.channel.sendMessage(`**ØªÙ… ØªØºÙŠÙŠØ± ØªÙˆÙŠØªØ´ Ø§Ù„Ø¨ÙˆØª Ø¥Ù„Ù‰  ${argresult}**`)
}

});

client.on("message", message => {
 if (message.content === `${prefix}help`) {
  const embed = new Discord.RichEmbed()
      .setColor("#000000")
      .setDescription(`
${prefix}play  
${prefix}skip  
${prefix}pause 
${prefix}resume
${prefix}vol   
${prefix}stop  
${prefix}np    
${prefix}queue 

 `)
   message.channel.sendEmbed(embed)
    
   }
   }); 
   


client.login(process.env.BOT_TOKEN);


