PIP=.env/bin/pip
PYTHON=.env/bin/python

install:
	# initializing virtualenv
	virtualenv .env

	# installing dependencies
	$(PIP) install -r requirements.txt

	# installing bower dependencies
	bower install 

run:
	# running application in virtualenv
	$(PYTHON) server.py

debug:
	# running in debug mode
	export TEST=True
	$(PYTHON) server.py