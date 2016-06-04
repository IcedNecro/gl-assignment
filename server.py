from flask import Flask, render_template, send_from_directory, jsonify, request
from api import SFCrimes

app = Flask(__name__)
app.config['BOWER'] = 'static/bower'

# Custom static data
@app.route('/bower/<path:filename>')
def bower(filename):
    return send_from_directory(app.config['BOWER'], filename)

@app.route('/data')
def data():
	return jsonify(**SFCrimes.get_filtered_data(**request.args))

@app.route('/')
def index():
	return render_template('index.html')

if __name__ == '__main__':
 	import os
 	
 	# export TEST=true --- enables debug messages
 	if 'TEST' in os.environ:
 		app.run(debug=os.environ['TEST'])
 	else:
 		app.run()
