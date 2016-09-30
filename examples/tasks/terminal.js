/* STAP terminal emulator


Sample interaction:

	[[Legend: 
	 ->  msg from task sw to user sw
	 <-  msg from user sw to task sw
	 //  comment
	]]

	// the line below has 2 special directives _template and _vis; these can be ignored by a computational agent – they’re for human experiments
	// the "$":{"_ix"… is a key-value pair, where “$” is the key, and “_ix” signifies that this is a text input
	// the _ix directive includes {"oninput":-1} option, which you can ignore (it signifies that the text input will be cleared after each newline)
	->  {"_template":"lib/stap-terminal.css","_vis":{"scrolldown":1},"$":{"_ix":{"oninput":-1}}}
	// line below is a msg from user (e.g. soar agent) to task, signifying that “ls –la” was entered into the “$” text input
	<-  {"$":"ls -la"}
	// the two lines below are messages from task, signifying the addition of respective text elements to the display
	->  "$ ls -la"
	->  "total 26\ndrwxrwx--- 1 root vboxsf  4096 Sep  8 15:56 .\ndrwxrwx--- 1 root vboxsf  4096 Jul 26 12:12 ..\ndrwxrwx--- 1 root vboxsf  4096 Jun 27 13:25 lib\n-rwxrwx--- 1 root vboxsf  1260 Apr 26 14:32 readme.txt\n-rwxrwx--- 1 root vboxsf   275 Dec 10  2015 stap.html\n-rwxrwx--- 1 root vboxsf 11113 Aug  3 21:44 stdio2socketServ.js\n-rwxrwx--- 1 root vboxsf   307 Sep  9 07:47 termjs.htm\n"
	<-  {"$":"ech"}
	->  "$ ech"
	->  "ERROR: sh: 1: ech: not found\n"
	<-  {"$":"echo \"hello world\""}
	->  "$ echo \"hello world\""
	->  "hello world\n"

*/

var cp = require('child_process'),
	sh = cp.spawn('sh');

function send(o){
	console.log(JSON.stringify(o));
}

sh.stdout.setEncoding('utf8')
sh.stdout.on("data", function(data) {
	// console.log(data);
	send(data);
});
sh.stderr.on("data", function(data) {
	// console.log(data);
	send('Error: '+data);
});
process.stdin.on('data', function (data) {
	var cmd = JSON.parse(data.toString());
	if(typeof(cmd)==="object" && cmd[1]==="$"){
		send('$ '+cmd[2]);
		sh.stdin.write(cmd[2]+'\n');
	}
});

send({
	_template:"lib/stap-terminal.css",
	_vis:{scrolldown:1},
	"$":{'_ix':{"oninput":-1}}
	});
