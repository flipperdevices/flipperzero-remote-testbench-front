# Flipper Zero Remote test Bench [Front-end Server]

<img width="600" src="https://habrastorage.org/webt/m_/vo/0w/m_vo0wi0ahy6hsnzqkfig8ywimg.jpeg" />

Fliper Zero Remote test bech — is hardware + software system for remotely control current Flipper Zero dev board. It is used for automated and manual testing. This repo contains files of Front-end Server.  

**URL:** https://lab.flipperzero.one  

## Project sctructure 
![](https://habrastorage.org/webt/ql/y9/af/qly9afe06nbwyysdgpdzgntkepk.png)

```
.
├── www          # Web UI
├── nginx        # RTMP Streamer config
└── Dockerfile   # Docker files
```

## Running in Docker

Two ports are exposed: `80` for web and `1935` for RTMP receiver.

The image could be used like that:
```
docker run --name lab -d \
  -p 1935:1935 \
  -p 80:80 \
  flipperdevices/flipperzero-remote-testbench-front
```