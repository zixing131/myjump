
function GetQueryString(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) return decodeURI(r[2]);
    return null;
}

const dialog = document.getElementById('dialog');
const dialogTextarea = document.querySelector('#dialog textarea');
const dialogTitle = document.querySelector('#dialog h1');
const dialogOkBtn = document.getElementById('dialogOk');
const dialogCancelBtn = document.getElementById('dialogCancel');
const dialogInfo = document.getElementById('dialogInfo');
const importBtn = document.getElementById('import');
const inputFile = document.getElementById('files');
const canvas = document.getElementById('canvas');

importBtn.addEventListener("click", function (ev) {
    inputFile.click();
});
inputFile.addEventListener('change', function (ev) {
    for (var fileindex=0;fileindex<inputFile.files.lenfth;fileindex++) {
        var file = inputFile.files[fileindex];
        console.log(file);
        const reader = new FileReader();
        reader.onerror = function () {
            console.log("error", reader.error);
        }
        reader.onload = function () {
            FS.writeFile('/mythroad/' + file.name, new Uint8Array(reader.result));
            print("写入:'" + file.name + "'完成.");
        };
        reader.readAsArrayBuffer(file);
    }
});

const midi = MidiPlayer();
const MR_SOUND_MIDI = 0;
const MR_SOUND_WAV = 1;
const MR_SOUND_MP3 = 2;
function js_playSound(type, data, dataLen, loop) {
    if (type == MR_SOUND_MIDI) {
        const buf = Module.HEAPU8.slice(data, data + dataLen);
        midi.play(buf.buffer, loop);
    } else {
        console.log(arguments);
    }
    return 0;
}

function js_stopSound(type) {
    if (type == MR_SOUND_MIDI) {
        midi.stop();
    } else {
        console.log(arguments);
    }
    return 0;
}

let shakef = 0;
let shakeStartTime = 0;

function js_startShake(ms) {
    shakeStartTime = Date.now();
    shakef = setInterval(() => {
        if (Date.now() - shakeStartTime >= ms) {
            js_stopShake();
            return;
        }
        if (canvas.style.marginLeft === '-121px') {
            canvas.style.marginLeft = '-119px';
        } else {
            canvas.style.marginLeft = '-121px';
        }
    }, 1);
    return 0;
}

function js_stopShake() {
    if (shakef) {
        clearInterval(shakef);
        shakef = 0;
        canvas.style.marginLeft = '-120px';
    }
    return 0;
}

const MR_DIALOG_EVENT = 6;
const MR_DIALOG_KEY_OK = 0; // 对话框/文本框等的"确定"键被点击(选择);
const MR_DIALOG_KEY_CANCEL = 1; // 对话框/文本框等的"取消"("返回")键被点击(选择);
const MR_DIALOG_OK = 0; // 对话框有"确定"键;
const MR_DIALOG_OK_CANCEL = 1; // 对话框有"确定" "取消"键;
const MR_DIALOG_CANCEL = 2; // 对话框有"返回"键
const MR_EDIT_ANY = 0;
const MR_EDIT_NUMERIC = 1;
const MR_EDIT_PASSWORD = 2;

function dialogRelease() {
    dialog.style.visibility = 'hidden';
    dialogOkBtn.style.visibility = 'hidden';
    dialogCancelBtn.style.visibility = 'hidden';
    dialogOkBtn.onclick = null;
    dialogCancelBtn.onclick = null;
    Module._setEventEnable(true);
}

function dialogCreate(title, text, keyType, editAble, editType, max_size) {
    Module._setEventEnable(false);
    dialog.style.visibility = 'visible';
    dialogTitle.innerText = getUnicodeStr(title);
    dialogTextarea.value = getUnicodeStr(text);
    dialogTextarea.scrollTop = 0;
    dialogTextarea.readOnly = !editAble;
    if (dialogTextarea.readOnly) {
        dialogInfo.innerText = '';
    }
    if (keyType == MR_DIALOG_OK_CANCEL || keyType == MR_DIALOG_OK) {
        dialogOkBtn.style.visibility = 'visible';
        dialogOkBtn.onclick = function (e) {
            if (editAble && getDialogText().length > max_size) {
                return;
            }
            dialogTextarea.readOnly = true;
            Module._c_event(MR_DIALOG_EVENT, MR_DIALOG_KEY_OK, 0);
        }
    }
    if (keyType == MR_DIALOG_OK_CANCEL || keyType == MR_DIALOG_CANCEL) {
        dialogCancelBtn.style.visibility = 'visible';
        dialogCancelBtn.onclick = function (e) {
            Module._c_event(MR_DIALOG_EVENT, MR_DIALOG_KEY_CANCEL, 0);
        }
    }
    dialogTextarea.oninput = function (e) {
        if (editType == MR_EDIT_NUMERIC) {
            // todo
        }
        if (editAble) {
            updateDialogInfo(max_size);
        }
    };
    if (editAble) {
        updateDialogInfo(max_size);
    }
}

function js_dialogCreate(title, text, type) {
    dialogCreate(title, text, type, false, 0, 0);
    return 1234;
}

function js_dialogRelease(dialog) {
    dialogRelease();
    return 0;
}

function js_dialogRefresh(dialog, title, text, keyType) {
    dialogTitle.innerText = getUnicodeStr(title);
    dialogTextarea.value = getUnicodeStr(text);
    if (keyType == -1) return 0;
    dialogOkBtn.style.visibility = 'hidden';
    dialogCancelBtn.style.visibility = 'hidden';
    dialogOkBtn.onclick = null;
    dialogCancelBtn.onclick = null;
    if (keyType == MR_DIALOG_OK_CANCEL || keyType == MR_DIALOG_OK) {
        dialogOkBtn.style.visibility = 'visible';
        dialogOkBtn.onclick = function (e) {
            Module._c_event(MR_DIALOG_EVENT, MR_DIALOG_KEY_OK, 0);
        }
    }
    if (keyType == MR_DIALOG_OK_CANCEL || keyType == MR_DIALOG_CANCEL) {
        dialogCancelBtn.style.visibility = 'visible';
        dialogCancelBtn.onclick = function (e) {
            Module._c_event(MR_DIALOG_EVENT, MR_DIALOG_KEY_CANCEL, 0);
        }
    }
    return 0;
}

function js_textCreate(title, text, type) {
    dialogCreate(title, text, type, false, 0, 0);
    return 1234;
}

function js_textRelease(handle) {
    dialogRelease();
    return 0;
}

function js_textRefresh(handle, title, text) {
    dialogTitle.innerText = getUnicodeStr(title);
    dialogTextarea.value = getUnicodeStr(text);
    return 0;
}

function getUnicodeStr(p) {
    let i = p / 2;
    const arr = [];
    while (Module.HEAPU16[i]) {
        const v = Module.HEAPU16[i];
        arr.push(String.fromCharCode((v >> 8 | v << 8) & 0xffff));
        i++;
    }
    return arr.join('');
}

function getDialogText() {
    let str = dialogTextarea.value;
    str = str.replace(/\r\n/g, '\n');
    str = str.replace(/\n/g, '\r\n');
    return str;
}

function updateDialogInfo(max_size) {
    const str = getDialogText();
    dialogInfo.innerText = str.length + '/' + max_size;
    if (str.length > max_size) {
        dialogInfo.style.color = 'red';
    } else {
        dialogInfo.style.color = 'black';
    }
}

function js_editCreate(title, text, type, max_size) {
    dialogCreate(title, text, MR_DIALOG_OK_CANCEL, true, type, max_size);
    return 1234;
}

function js_editRelease(edit) {
    dialogRelease();
    return 0;
}

let holdTextMem = 0;

function js_editGetText(edit) {
    const str = getDialogText();
    const len = str.length + 1;
    if (holdTextMem != 0) {
        Module._my_freeExt(holdTextMem);
    }
    holdTextMem = Module._my_mallocExt(len * 2);
    if (holdTextMem != 0) {
        let ptr = holdTextMem;
        for (let a = 0; a < str.length; a++) {
            const v = str.charCodeAt(a);
            Module.HEAPU8[ptr++] = (v >> 8) & 0xff;
            Module.HEAPU8[ptr++] = v & 0xff;
        }
        Module.HEAPU8[ptr++] = 0;
        Module.HEAPU8[ptr] = 0;
    }
    return holdTextMem;
}

function touch_add(id, code) {
    const key = document.getElementById(id);
    key.onmousedown = function (e) {
        Module._c_event(0, code, 0);
        e.preventDefault();
    }
    key.onmouseup = function (e) {
        Module._c_event(1, code, 0);
        e.preventDefault();
    }
    key.ontouchstart = key.onmousedown;
    key.ontouchend = key.onmouseup;
}
touch_add("key_0", 0);
touch_add("key_1", 1);
touch_add("key_2", 2);
touch_add("key_3", 3);
touch_add("key_4", 4);
touch_add("key_5", 5);
touch_add("key_6", 6);
touch_add("key_7", 7);
touch_add("key_8", 8);
touch_add("key_9", 9);
touch_add("key_star", 10);
touch_add("key_pound", 11);
touch_add("key_up", 12);
touch_add("key_down", 13);
touch_add("key_left", 14);
touch_add("key_right", 15);
touch_add("key_sleft", 17);
touch_add("key_sright", 18);
touch_add("key_ok", 20);


var statusElement = document.getElementById('status');
var progressElement = document.getElementById('progress');
function print(text) {
    if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
    console.log(text);
}
function setTitle() {
    const title = GetQueryString('title')
    if (title) {
        document.title = title;
    }
}

var Module = {
    preRun: [],
    postRun: [setTitle],
    print: print,
    printErr: function (text) {
        if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
        console.error(text);
    },
    canvas: (function () {
        var canvas = document.getElementById('canvas');

        // As a default initial behavior, pop up an alert when webgl context is lost. To make your
        // application robust, you may want to override this behavior before shipping!
        // See http://www.khronos.org/registry/webgl/specs/latest/1.0/#5.15.2
        canvas.addEventListener("webglcontextlost", function (e) {
            alert('WebGL context lost. You will need to reload the page.');
            e.preventDefault();
        }, false);

        return canvas;
    })(),
    setStatus: function (text) {
        if (!Module.setStatus.last) Module.setStatus.last = {
            time: Date.now(),
            text: ''
        };
        if (text === Module.setStatus.last.text) return;
        var m = text.match(/([^(]+)\((\d+(\.\d+)?)\/(\d+)\)/);
        var now = Date.now();
        if (m && now - Module.setStatus.last.time < 30) return; // if this is a progress update, skip it if too soon
        Module.setStatus.last.time = now;
        Module.setStatus.last.text = text;
        if (m) {
            text = m[1];
            progressElement.value = parseInt(m[2]) * 100;
            progressElement.max = parseInt(m[4]) * 100;
            progressElement.style.visibility = 'visible';
        } else {
            progressElement.style.visibility = 'hidden';
        }
        statusElement.innerHTML = text;
    },
    totalDependencies: 0,
    monitorRunDependencies: function (left) {
        this.totalDependencies = Math.max(this.totalDependencies, left);
        Module.setStatus(left ? 'Preparing... (' + (this.totalDependencies - left) + '/' + this.totalDependencies + ')' : 'All downloads complete.');
    }
};
Module.setStatus('Downloading...');
window.onerror = function (event) {
    // TODO: do not warn on ok events like simulating an infinite loop or exitStatus
    Module.setStatus('Exception thrown, see JavaScript console');
    Module.setStatus = function (text) {
        if (text) Module.printErr('[post-exception status] ' + text);
    };
}; 