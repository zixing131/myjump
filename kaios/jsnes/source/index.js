 var nes;
$(function() {
	nes = new JSNES({
		'ui': $('#emulator').JSNESUI({
			"经典": [ 
				['SuperMario', 'SuperMario.nes'],
			] 
		})
	});
	nes.ui.loadROM('SuperMario.nes');
});

//设置按键函数
function handleKeydown(e) { 
  switch(e.key) {
	case '2':
    case 'ArrowUp':
      
	nes.keyboard.keyDown({
                        keyCode: 87
                    });
						break;
	case '8':
    case 'ArrowDown':
      
	  nes.keyboard.keyDown({
                            keyCode: 83
                        });
						
						break;
	case '6':
    case 'ArrowRight':
	nes.keyboard.keyDown({
                            keyCode: 68
                        });
						
      break;
	  
	case '4':
    case 'ArrowLeft':
	  nes.keyboard.keyDown({
			keyCode: 65
		});
		
      break;
	  
	case '5':
    case 'Enter':
	  nes.keyboard.keyDown({
			keyCode: 13
		});
      break;
	  
	case '0':
		nes.keyboard.keyDown({
			keyCode: 17
		});
      break;
	  
	case '1':
	
	
		nes.keyboard.keyDown({
			keyCode: 75
		});
	break;
	
	case '3':
	
	nes.keyboard.keyDown({
			keyCode: 74
		});
	break;
	  
    case 'Backspace':
      break;
	  
	case 'Q':
    case 'SoftLeft':
      break;
	  
	case 'E':
    case 'SoftRight':
      break;
	  
  }
}



function handlekeyUp(e) { 
  switch(e.key) {
	case '2':
    case 'ArrowUp':
      
	nes.keyboard.keyUp({
                        keyCode: 87
                    });
						break;
	case '8':
    case 'ArrowDown':
      
	  nes.keyboard.keyUp({
                            keyCode: 83
                        });
						
						break;
	case '6':
    case 'ArrowRight':
	nes.keyboard.keyUp({
                            keyCode: 68
                        });
						
      break;
	  
	case '4':
    case 'ArrowLeft':
	  nes.keyboard.keyUp({
			keyCode: 65
		});
		
      break;
	  
	case '5':
    case 'Enter':
	  nes.keyboard.keyUp({
			keyCode: 13
		});
      break;
	  
	case '0':
		nes.keyboard.keyUp({
			keyCode: 17
		});
      break;
	  
	case '1':
	
	
		nes.keyboard.keyUp({
			keyCode: 75
		});
	break;
	
	case '3':
	
	nes.keyboard.keyUp({
			keyCode: 74
		});
	break;
	  
    case 'Backspace':
      break;
	  
	case 'Q':
    case 'SoftLeft':
      break;
	  
	case 'E':
    case 'SoftRight':
      break;
	case '#':
	 alert('超级玛丽 kaios 移植 by zixing \n  2846 对应上下左右，5确定 0 选择，1为A键（跳跃），3为B键（子弹）。');
	break;
	  
  }
}


document.activeElement.addEventListener('keydown', handleKeydown);
 
document.activeElement.addEventListener('keyup', handlekeyUp);
 
 