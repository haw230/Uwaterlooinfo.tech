# importing the requests library 
import requests 
  
# api-endpoint 
URL = "https://api.uwaterloo.ca/v2/courses.json"
  
# api key given here 
key = "043f31a8bada20f13b879fea1e64af16"
  
# defining a params dict for the parameters to be sent to the API 
PARAMS = {'key':key} 
  
# sending get request and saving the response as response object 
r = requests.get(url = URL, params = PARAMS) 
  
# extracting data in json format 
result = r.json() 
courses = [];

for i in result["data"]:
    courses.append(str(i["subject"]) + str(i["catalog_number"] + " " + str(i["title"]) + "\n"))

courses.sort()
f = open('courses.txt','w')

for i in courses:
    f.write(i)

f.close()