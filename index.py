from flask import Flask, jsonify, send_from_directory, render_template
import os

app = Flask(__name__)

@app.route('/api/phones', methods=['GET'])
def get_phones():
    phones = [
        {
            'name': 'iPhone 16 Pro Max',
            'screen': '6.9 inch',
            'processor': 'Apple A18 Pro',
            'camera': '108 MP',
            'battery': '4685 mAh',
            'storage': '256 GB',
            'model_path': 'models/iphone_16_pro_max.glb'
        },
        {
            'name': 'Samsung Galaxy S22 Ultra',
            'screen': '6.8 inch',
            'processor': 'Qualcomm Snapdragon 8 Gen 1',
            'camera': '108 MP',
            'battery': '5000 mAh',
            'storage': '128 GB',
            'model_path': 'models/samsung_galaxy_s22_ultra.glb'
        },
        {
            'name': 'Samsung Galaxy Z Flip 3',
            'screen': '6.7 inch',
            'processor': 'Qualcomm Snapdragon 888',
            'camera': '12 MP',
            'battery': '3300 mAh',
            'storage': '128 GB',
            'model_path': 'models/Samsung_Galaxy_Z_Flip_3.glb'
        }
    ]
    return jsonify(phones)

@app.route('/models/<path:filename>', methods=['GET'])
def get_model(filename):
    return send_from_directory('models', filename)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/<path:filename>', methods=['GET'])
def get_resource(filename):
    return send_from_directory('.', filename)

if __name__ == '__main__':
    app.run(debug=True)