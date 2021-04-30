from multiprocessing import Process, Queue, Array, Manager
import RPi.GPIO as GPIO
import time
import requests
import serial
from urllib.parse import parse_qsl
from datetime import datetime


def hub_boot(devices_sync, q_queue):
    r = requests.get('https://us-west-2.aws.webhooks.mongodb-realm.com/api/client/v2.0/app/datahub-pwvbn/service/Sensors/incoming_webhook/HubBoot')
    return_data = r.json()

    process_controls(return_data['ControlQueue'], q_queue)

    for raw_device in return_data['Devices']:
        devices_sync[int(raw_device['DeviceID']['$numberInt'])] = {
            'LastQuery': 0,
            'QueryEvery': int(raw_device['QueryEvery']['$numberInt'])
        }


def query_devices(hc12_serial, q_queue, r_queue):
    while True:
        query_device_id = q_queue.get()
        check_control = False
        postfix = ''

        if ':' in str(query_device_id):
            check_control = True
            query_device_id, postfix = query_device_id.split(':')
            command = str.encode("C"+str(query_device_id).zfill(2)+postfix+"\n")
        else:
            command = str.encode("Q"+str(query_device_id).zfill(2)+"\n")

        hc12_serial.write(command)
        print("Device: "+str(query_device_id)+" - "+command.decode().rstrip("\n"))

        try:
            query_string = HC12.readline().decode().lstrip('\n\r')
            if query_string:
                sensor_data = dict(parse_qsl(query_string))

                if str(sensor_data['DID']) != str(query_device_id):
                    print('The wrong device responded '+str(sensor_data['DID'])+' != '+str(query_device_id))

                if postfix and check_control:
                    control_id = postfix[0]
                    action = postfix[1]
                    control_key = 'VC:'+control_id
                    if control_key in sensor_data.keys() and str(sensor_data[control_key]) == action:
                        try:
                            requests.get('https://us-west-2.aws.webhooks.mongodb-realm.com/api/client/v2.0/app/datahub-pwvbn/service/Sensors/incoming_webhook/DeleteControl?DID='+query_device_id+'&CID='+control_id+'&Action='+action)
                        except OSError:
                            print("A request error happened.")
                            continue

                r_queue.put(sensor_data)
            else:
                print("No response")
        except UnicodeDecodeError:
            print("Bad data received.")


def data_import(r_queue, q_queue, devices_sync):
    while True:
        sensor_data = r_queue.get()
        today = datetime.now().timestamp()
        sensor_data['Timestamp'] = round(today)
        print(sensor_data)

        try:
            r = requests.post('https://us-west-2.aws.webhooks.mongodb-realm.com/api/client/v2.0/app/datahub-pwvbn/service/Sensors/incoming_webhook/DataImport?secret=v9zt78', json=sensor_data)
        except OSError:
            print("A request error happened.")
            continue

        return_data = r.json()
        process_controls(return_data['ControlQueue'], q_queue)

        for raw_device in return_data['Devices']:
            d_id = int(raw_device['DeviceID']['$numberInt'])
            every = int(raw_device['QueryEvery']['$numberInt'])

            if d_id in devices_sync.keys():
                d = devices_sync[d_id]
                d['QueryEvery'] = every
                devices_sync[d_id] = d
            else:
                devices_sync[d_id] = {
                    'LastQuery': 0,
                    'QueryEvery': every
                }


def process_controls(controls, q_queue):
    for control in controls:
        command = control['DeviceID']+':'+str(control['ControlID'])+str(control['Action'])
        q_queue.put(command)


if __name__ == '__main__':
    GPIO.setwarnings(False)
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(4, GPIO.OUT)
    GPIO.output(4, 1)
    
    HC12 = serial.Serial(
        port='/dev/ttyS0',
        baudrate=9600,
        parity=serial.PARITY_NONE,
        stopbits=serial.STOPBITS_ONE,
        bytesize=serial.EIGHTBITS,
        timeout=4
    )

    query_queue = Queue()
    readings_queue = Queue()
    manager = Manager()
    devices = manager.dict()
    hub_boot(devices, query_queue)

    query = Process(target=query_devices, args=(HC12, query_queue, readings_queue))
    query.daemon = True
    query.start()

    upload = Process(target=data_import, args=(readings_queue, query_queue, devices))
    upload.daemon = True
    upload.start()

    while True:
        now = time.time()

        for device_id, device_metrics in devices.items():
            device_id = device_id
            next_query = device_metrics['LastQuery'] + device_metrics['QueryEvery']

            if now >= next_query:
                device_metrics['LastQuery'] = now
                devices[device_id] = device_metrics
                query_queue.put(device_id)

        time.sleep(.1)
