####\# dependencies developer-mashine
	sudo aptitude install npm nodejs-legacy ruby-dev
	npm install
	sudo npm install -g grunt-cli bower
	sudo gem install compass

####\# dependencies server
        sudo aptitude install npm nodejs-legacy

####\# where applicable
    bower prune
    bower install

####\# generate the `dist` folder
    grunt

####\# on the server the form should run as user fastdform
    useradd -m -U fastdform
    cp -a dist/ /home/fastdform/ffffng
    chown fastdform:fastdform -Rf /home/fastdform/ffffng/
    sudo su - fastdform
    cd ~/ffffng
    npm install
    cd ~
    vim config.json
    cd ffffng/
    ln -s ../config.json
    cd ~
    mkdir keys
    mkdir bin 
    cp ~/ffffng/assest/autoupdate.sh ~/bin/
    chmod +x ~/bin/autoupdate.sh

####\# Keys repository
    mkdir /home/fastdform/keys
    cd /home/fastdform/keys
    git init
    git config user.email "formular@gothamcity.freifunk.net"
    git config user.name "Knotenformular"

####\# add this to your users crontab

    crontab -e

	    */1 * * * * sleep 20 && /home/fastdform/bin/autoupdate.sh > /dev/null 2>&1
	    */1 * * * * /home/fastdform/ffffng/bin/fix_key_file_names.py /home/fastdform/keys > /dev/null 2>&1

####\# create the init script to start the form as deamon
    su -
    cp /home/fastdform/ffffng/assets/init.d.fastdform /etc/init.d/fastdform
    update-rc.d fastdform defaults
    service fastdform start

####\# start the server on http://localhost:8080/
    node server/main.js

####\# example apache config
	cat > /etc/apache2/sites-available/formular.conf <<EOF
	<VirtualHost *:80>
	    ServerName formular.localhost
	    
	    ProxyRequests Off
	    ProxyVia Off
	    
	    ProxyPass / http://127.0.0.1:8080/
	    ProxyPassReverse / http://127.0.0.1:8080/
	</VirtualHost>
	EOF

	cd /etc/apache2/sites-enabled
	ln -s ../sites-available/formular.conf 002-formular.conf

	apache2ctl restart

