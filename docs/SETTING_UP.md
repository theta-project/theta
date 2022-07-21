# Setting up theta!
Thank you for choosing to run theta! as it's currently alpha software the steps to run it are very minimal and are subject to change.

## Requirements
- git
- node.js (tested on 18.5)
- nginx 

## Acquiring theta!
After installing the requirements please go to the folder where you plan on installing theta and running
```
$ git clone --recursive https://github.com/theta-project/theta.git
```
To then aquire the node modules necessary please do
```
$ cd /path/to/theta
$
$ npm install
```
Then make a copy of the example config and editing it using your favourite editor
```
$ cp config.example.js config.js
$ nano config.js
```

## Setting up nginx
There is an example nginx config in the "ext" folder, please copy it to your nginx path, an example of which is 
```
$ sudo cp /path/to/theta/ext/nginx.conf /etc/nginx/sites-enabled/theta
```
Then, run the script to generate the *.ppy.sh certificates
```
$ ./path/to/theta/ext/generate_certificates.sh
```
Finally, edit the nginx config to add your servers domain (currently the main method is the hosts method)
```
$ nano /etc/nginx/sites-enabled/theta
$ sudo service nginx restart
```

## Running theta
```
$ cd /path/to/theta
$ npm install .
$ npm install -g tsx
$ npm run start
```