#!/usr/bin/python
import sys
import requests
import time

if len(sys.argv) != 4:
    print 'afg-appiot.py <id> <value> <timestamp>'
    sys.exit(2)
gatewayID = 'ed7dc500-16ca-4158-b5e1-90b53ef7ba79'
httpServiceUri = 'https://eappiotsens.servicebus.windows.net'
httpServicePath = 'datacollectoroutbox/publishers/ed7dc500-16ca-4158-b5e1-90b53ef7ba79'
httpSAS = 'SharedAccessSignature sr=https%3a%2f%2feappiotsens.servicebus.windows.net%2fdatacollectoroutbox%2fpublishers%2fed7dc500-16ca-4158-b5e1-90b53ef7ba79%2fmessages&sig=KtXPIGkRw5KRm2SI0fuJAf6hiLXNQZgVcuK2bfu6MTo%3d&se=4662284993&skn=SendAccessPolicy'
postURL = httpServiceUri + "/" + httpServicePath + "/messages";
headers = {'Authorization': httpSAS,'DataCollectorId': gatewayID,'PayloadType': 'Measurements','Timestamp': int(time.time()),'Content-Type': 'application/atom+xml;type=entry;charset=utf-8','Cache-ontrol': 'no-cache'}
post_data = '[{\"id\":\"'+ sys.argv[1] +'\",\"v\": [{\"m\":[' + sys.argv[2] + '],\"t\":'+str(int(sys.argv[3])*1000)+'}]}]'
ret = requests.post(postURL,headers=headers,data=post_data)
print(ret)
