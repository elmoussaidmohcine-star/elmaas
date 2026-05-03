# ELMAAS — Gunicorn + Eventlet config
# Eventlet : I/O non-bloquant, ~500 connexions WebSocket par worker

import eventlet
eventlet.monkey_patch()

worker_class = "eventlet"
workers = 1                  # 1 seul worker avec eventlet (partagent la même RAM)
worker_connections = 1000    # connexions simultanées par worker
timeout = 120                # timeout requête (analyses IA longues)
keepalive = 5
bind = "0.0.0.0:8080"
loglevel = "info"
accesslog = "-"
errorlog = "-"