import os

dir='./freej2me'

removeflag='.m3g'

def delfiles(datadir):
    dirs=os.listdir(datadir)
    for d in dirs:
        d2=datadir+'/'+d
        if(os.path.isdir(d2)):
            delfiles(d2)
        elif(os.path.isfile(d2)):
            fcontent = open(d2,'r',encoding='u8').read()
            if(fcontent.find(removeflag)>-1):
                print(d2)
                os.remove(d2)

delfiles(dir)


