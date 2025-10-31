// ==UserScript==
// @name         Full Unix-like Browser Terminal with Path Autocomplete
// @namespace    http://tampermonkey.net/
// @version      1.8
// @description  Browser terminal with fake FS, real FS, pipes, autocomplete (multi-level paths), colored output, shortcut Ctrl+Shift+T
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    document.addEventListener('keydown', function(e) {
        if(e.ctrlKey && e.shiftKey && e.code==='KeyP'){
            e.preventDefault();
            const terminalTab = window.open('', '_blank');
            if(!terminalTab) return;

            const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Unix-like Browser Terminal</title>
<style>
body { margin:0; background:#1e1e1e; color:#00ff00; font-family: monospace; display:flex; flex-direction: column; height:100vh; }
#output { flex:1; padding:10px; overflow-y:auto; }
#input { border:none; outline:none; background:#1e1e1e; color:#00ff00; font-family: monospace; font-size:16px; padding:10px; }
::placeholder { color:#00ff00; opacity:0.5; }
.dir { color: #00bfff; }
.file { color: #00ff00; }
.error { color: #ff4d4d; }
.jsres { color: #ffff66; }
</style>
</head>
<body>
<div id="output"></div>
<input id="input" type="text" autofocus placeholder="Type commands here...">
<script>
const output = document.getElementById('output');
const input = document.getElementById('input');
const history = [];
let histIndex=0;

const fs={'/':{'home':{},'readme.txt':'Welcome to Browser Terminal!'}};
let cwd='/';
const user='guest';
let realCWDHandle=null;

// Helpers
function print(text,cls=''){ const div=document.createElement('div'); div.textContent=text; if(cls) div.className=cls; output.appendChild(div); output.scrollTop=output.scrollHeight; }
function resolvePath(path){ if(!path) return cwd; if(path.startsWith('/')) return path; if(cwd==='/' ) return '/' + path; return cwd + '/' + path; }
function getDir(path){ const parts=path.split('/').filter(Boolean); let cur=fs['/']; for(let p of parts){ if(cur[p]&&typeof cur[p]==='object') cur=cur[p]; else return null; } return cur; }
function getFile(path){ const parts=path.split('/').filter(Boolean); const fname=parts.pop(); const dir=getDir('/'+parts.join('/')); if(dir&&dir[fname]&&typeof dir[fname]!=='object') return dir[fname]; return null; }
function deletePath(path){ const parts=path.split('/').filter(Boolean); const name=parts.pop(); const dir=getDir('/'+parts.join('/')); if(dir&&dir[name]){ delete dir[name]; return true;} return false; }
function fileList(dir){ return dir?Object.keys(dir):[]; }

// Multi-level path autocomplete
let tabIndex=0;
let lastCompletions=[];
async function getCompletions(text){
    const cmds=Object.keys(commands);
    let completions=[];
    
    if(!text.includes('/')){
        completions=cmds.filter(c=>c.startsWith(text));
    } else {
        const parts=text.split('/');
        const partial=parts.pop();
        const pathPrefix=parts.length?('/'+parts.join('/')):'/';

        let dir=getDir(pathPrefix)||{};
        let fakeMatches=Object.keys(dir).filter(k=>k.startsWith(partial)).map(k=>pathPrefix+(pathPrefix==='/'?'':'/')+k);

        let realMatches=[];
        if(realCWDHandle){
            let handle = realCWDHandle;
            if(pathPrefix!=='/'){
                try{
                    const subParts=pathPrefix.split('/').filter(Boolean);
                    for(const p of subParts){ handle=await handle.getDirectoryHandle(p); }
                } catch(e){handle=null;}
            }
            if(handle){
                for await(const [name,h] of handle.entries()){
                    if(name.startsWith(partial)) realMatches.push(pathPrefix+(pathPrefix==='/'?'':'/')+name);
                }
            }
        }

        completions=fakeMatches.concat(realMatches);
    }

    return completions;
}

// Pipe executor
async function executePipes(cmdLine){
    const parts=cmdLine.split('|').map(p=>p.trim());
    let inputData='';
    for(let i=0;i<parts.length;i++){
        const [cmd,...args]=parts[i].split(' '); const argStr=args.join(' ');
        if(commands[cmd]){
            const result=await commands[cmd](argStr,inputData);
            if(result!==undefined) inputData=result;
        } else { print('Unknown command: '+cmd,'error'); return; }
    }
}

// Commands
const commands={
help:()=>{print('Commands: help, clear, pwd, ls, cd, mkdir, rmdir, touch, rm, cp, mv, tree, date, whoami, history, echo, js, grep, head, tail, wc, sort, uniq, openfolder, lsreal, readfile, writefile');},
clear:()=>{output.innerHTML='';},
pwd:()=>cwd,
ls:()=>{ const dir=getDir(cwd); if(!dir){print('No such dir','error'); return;} fileList(dir).forEach(k=>print(k,typeof dir[k]==='object'?'dir':'file'));},
cd:(args)=>{ const path=resolvePath(args); if(getDir(path)) cwd=path; else print('No such dir: '+path,'error'); },
mkdir:(args)=>{ const path=resolvePath(args); const parts=path.split('/').filter(Boolean); const name=parts.pop(); const parent=getDir('/'+parts.join('/')); if(parent) parent[name]={}; },
rmdir:(args)=>{ const path=resolvePath(args); const dir=getDir(path); if(dir&&Object.keys(dir).length===0) deletePath(path); else print('Directory not empty or not found','error'); },
touch:(args)=>{ const path=resolvePath(args); const parts=path.split('/').filter(Boolean); const name=parts.pop(); const parent=getDir('/'+parts.join('/')); if(parent) parent[name]=''; },
rm:(args)=>{ const path=resolvePath(args); if(deletePath(path)){} else print('File not found','error'); },
cp:(args)=>{ const [src,dst]=args.split(' '); const content=getFile(resolvePath(src)); if(content!==null){ const parts=resolvePath(dst).split('/').filter(Boolean); const name=parts.pop(); const parent=getDir('/'+parts.join('/')); if(parent) parent[name]=content; } else print('Source file not found','error'); },
mv:(args)=>{ const [src,dst]=args.split(' '); const content=getFile(resolvePath(src)); if(content!==null){ commands.cp(args); commands.rm(src); } else print('Source file not found','error'); },
cat:(args,inputData)=>{ const f=getFile(resolvePath(args))||inputData; if(f!==null) return f; else print('File not found: '+args,'error'); },
tree:()=>{ function walk(dir,path){for(let k in dir){ if(typeof dir[k]==='object'){ print(path+k+'/','dir'); walk(dir[k],path+k+'/'); } else print(path+k,'file'); } } walk(getDir(cwd),cwd+'/'); },
date:()=>print(new Date().toString()),
whoami:()=>print(user),
history:()=>history.forEach((c,i)=>print((i+1)+': '+c)),
echo:(args,inputData)=>args||inputData,
js:(args,inputData)=>{ try{ 
    // WARNING: eval is used intentionally for a terminal emulator. Only use this in trusted environments.
    // This command allows executing arbitrary JavaScript for debugging purposes.
    const r=eval(args||inputData); 
    print(r,'jsres'); 
    return r;
} catch(e){ print('JS Error: '+e,'error'); } },
grep:(pattern,inputData)=>{ if(!inputData) return; return inputData.split('\\n').filter(l=>l.includes(pattern)).join('\\n'); },
head:(args,inputData)=>{ const n=parseInt(args)||5; if(!inputData) return; return inputData.split('\\n').slice(0,n).join('\\n'); },
tail:(args,inputData)=>{ const n=parseInt(args)||5; if(!inputData) return; const lines=inputData.split('\\n'); return lines.slice(-n).join('\\n'); },
wc:(args,inputData)=>{ if(!inputData) return; const lines=inputData.split('\\n'); const words=inputData.split(/\\s+/); 
    // Optimized: Use length property instead of split('').length - both give same result but length is O(1)
    const chars=inputData.length; return lines.length+' '+words.length+' '+chars; },
sort:(args,inputData)=>{ if(!inputData) return; return inputData.split('\\n').sort().join('\\n'); },
uniq:(args,inputData)=>{ if(!inputData) return; const seen={}; return inputData.split('\\n').filter(l=>!seen[l]&&(seen[l]=true)).join('\\n'); },
openfolder: async ()=>{ try{ realCWDHandle=await window.showDirectoryPicker(); print('Folder selected: '+realCWDHandle.name); } catch(e){print('Cancelled','error'); } },
lsreal: async ()=>{ if(!realCWDHandle) return print('No folder selected.','error'); try{ for await(const [name,h] of realCWDHandle.entries()){ print(name+(h.kind==='directory'?'/':''),(h.kind==='directory'?'dir':'file')); } } catch(e){print('Error: '+e,'error'); } },
readfile: async(args)=>{ if(!realCWDHandle) return print('No folder selected.','error'); try{ const f=await realCWDHandle.getFileHandle(args); const file=await f.getFile(); const text=await file.text(); print(text); return text;} catch(e){print('Error reading file: '+e,'error');} },
writefile: async(args)=>{ if(!realCWDHandle) return print('No folder selected.','error'); const [fname,...rest]=args.split(' '); const content=rest.join(' '); try{ const f=await realCWDHandle.getFileHandle(fname,{create:true}); const w=await f.createWritable(); await w.write(content); await w.close(); print('File written: '+fname); } catch(e){print('Error writing file: '+e,'error');} }
};

input.addEventListener('keydown',async (e)=>{
    if(e.key==='Enter'){
        const cmdLine=input.value.trim();
        if(!cmdLine) return;
        history.push(cmdLine); histIndex=history.length;
        input.value='';
        print('> '+cmdLine);
        await executePipes(cmdLine);
    } else if(e.key==='ArrowUp'){ if(histIndex>0){ histIndex--; input.value=history[histIndex]; } }
    else if(e.key==='ArrowDown'){ if(histIndex<history.length-1){ histIndex++; input.value=history[histIndex]; } else { histIndex=history.length; input.value=''; } }
    else if(e.key==='Tab'){ e.preventDefault(); lastCompletions=await getCompletions(input.value); if(lastCompletions.length>0){ input.value=lastCompletions[tabIndex%lastCompletions.length]; tabIndex++; } } 
    else{ tabIndex=0; }
});

print('Unix-like Browser Terminal Ready. Ctrl+Shift+T opens it. Colored output, autocomplete (Tab), path completion, and pipes (|) supported.');
</script>
</body>
</html>
`;
            terminalTab.document.write(html);
            terminalTab.document.close();
        }
    });
})();
