import time  
import datetime  
import sys  

st = datetime.datetime.fromtimestamp(float(sys.argv[3])).strftime('%Y-%m-%d %H:%M:%S')  
f = open('/opt/z-way-server/automation/measure.log', 'a')
f.write(st+"\t"+sys.argv[1]+"\t"+sys.argv[2]+"\n")  
f.close()
