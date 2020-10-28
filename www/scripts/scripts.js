(function () {

    // API endpoints
//    const config = {
//        videoUrl: 'https://lab.flipperzero.one:8080/live?port=1985&app=myapp&stream=randomname',
//        sseUrl: 'http://flipper.lh0.ru/api/messages-sse.php',
//        apiUrl: 'http://flipper.lh0.ru/api/',
//        token: localStorage.getItem('token')
//    }

    const config = {
        videoUrl: 'https://lab.flipperzero.one/live?app=myapp&stream=randomname',
        sseUrl: 'https://lab.flipperzero.one/api/messages-sse.php', 
        apiUrl: 'https://lab.flipperzero.one/api/',
        token: localStorage.getItem('token')
    }

    // Link elements
    const screen1 = document.querySelector('#screen-1');
    const screen2 = document.querySelector('#screen-2');
    const fullscreenToggles = document.querySelectorAll('.fullscreen-toggle');
    const filterCheckboxes = document.querySelectorAll('.filter-checkbox');
    const uploadButtons = document.querySelectorAll('#flipper__button-open-file, #upload-firmware');
    const resetButton = document.querySelector('#reset-device');
    const uploadSelector = document.querySelector('#upload-selector');
    const log = document.querySelector('#log');
    const discNavigator = document.querySelector('#flipper__disc');
    const flipperLCD = document.querySelector('#flipper-lcd')
    const ledEl = document.querySelector('#flipper__led__lamp');
    const flipperArt = document.querySelector('#flipper__art');
    const flipperDecorations = document.querySelector('#flipper__decorations');
    const flipperBody = document.querySelector('#flipper__body');
    const consoleCommandline = document.querySelector('#console-commandline');
    const consoeInputForm = document.querySelector('#console-input-form');
    const contentTitle = document.querySelector('.content__title');
    const consoleTitle = document.querySelector('.console__title');


    // Messages
    const messsages = {
        accessGranted: [
            "Let's feed me :3",
            "Okay, let's play!",
            "Come on. But are you really a developer?",
            "Pushing dummy buttons was sad, right?",
            "You can make everyfing, but don't touch my fin, please.",
            "Praise yourself, you speak dolphin pretty well.",
            "Glad to see that you can type something significant.",
        ],
        accessDenied: [
            "You shall not pass!",
            "My mommy told me not to talk to bastards.",
            "Hey, man. Don't you see we have a dinner?",
            "I washed my fin. What did you said?",
            "Nope. You are boring.",
            "You can try until the end of time.",
            "I say NO. *grumpy flipper image*",
        ]
    }

    const getRandomMessage = function(library) {
        return library[Math.floor(Math.random() * Math.floor(library.length))]
    }

    const formatTime = function(unixTimestap) {
      const dtFormat = new Intl.DateTimeFormat('en-GB', {
        timeStyle: 'medium',
        timeZone: 'UTC'
      });
      
      return dtFormat.format(new Date(unixTimestap * 1000));
    }


    // Auth
    const authorize = async function(token) {
        const body = new FormData();
        body.append('act', 'auth');
        body.append('auth', token);

        const request = new Request(config.apiUrl, {
            method: 'POST', 
            body: body
        });

        let response = await fetch(request);
        response = await response.json();

        if (!response || response.err) {
           if (response.err === 2) {
                insertLogItem('error', getRandomMessage(messsages.accessDenied));
                deauthorize();
                return false;
           } else if (response.err === 1) {
                localStorage.setItem('token', token);
                config.token = token;
                consoleCommandline.placeholder = '> Type command here';
                consoleCommandline.autocomplete = 'on';
                consoleCommandline.value = '';
                insertLogItem('success', getRandomMessage(messsages.accessGranted));
                return true;
           }
        }

        insertLogItem('error', response);
    }

    const deauthorize = async function() {
        localStorage.removeItem('token');
        consoleCommandline.placeholder = '> Type token here to access device input';
        consoleCommandline.autocomplete = 'off';
    }


    // Read token from #hash
    const locationHash = window.location.hash.substr(1);

    if (locationHash) {
        config.token = locationHash;
        history.replaceState(null, null, ' ');
    }

    if (!config.token || !authorize(config.token)) {
        deauthorize();
    }


    // Commandline
    const submitCommandline = async function(event) {
        event.preventDefault();
        const command = consoleCommandline.value;

        if (!command) {
            return false;
        }

        if (!config.token) {
            authorize(command);
            return false;
        }

        const response = await sendCommand('cli', {
            data: command
        });

        insertLogItem('cmd', response);

        return false;
    }


    // Adaptive
    flipperView = 2; // 0 = Interface, 1 = Device, 2 = Full

    const setFlipperView = function(view) {
        switch (view) {
            case 0:
                flipperDecorations.setAttribute('display', 'none');
                flipperBody.setAttribute('display', 'none');
                flipperArt.setAttribute('viewBox', '409 190 515 158');
                flipperArt.setAttribute('width', 515);
                flipperArt.setAttribute('height', 158);
                flipperArt.style.maxWidth = '515px';
                flipperArt.style.maxHeight = '158px';
                flipperView = view;
                break;

            case 1:
                flipperDecorations.setAttribute('display', 'none');
                flipperBody.removeAttribute('display', 'none');
                flipperArt.setAttribute('viewBox', '240 170 720 300');
                flipperArt.setAttribute('width', 720);
                flipperArt.setAttribute('height', 300);
                flipperArt.style.maxWidth = '720px';
                flipperArt.style.maxHeight = '300px';
                flipperView = view;
                break;

            case 2:
                flipperDecorations.removeAttribute('display', 'none');
                flipperBody.removeAttribute('display', 'none');
                flipperArt.setAttribute('viewBox', '0 0 1200 580');
                flipperArt.setAttribute('width', 1200);
                flipperArt.setAttribute('height', 580);
                flipperArt.style.maxWidth = '1200px';
                flipperArt.style.maxHeight = '580px';
                flipperView = view;
                break;
        }
    }


    const adaptView = function(event) {
        const screen1Height = screen1.clientHeight;
        const screen1Width = screen1.clientWidth;

        let useSplitscreen = true;

        // Landscape fix
        if (window.innerWidth >= 600 && window.innerHeight <= 600) {
            useSplitscreen = false;
        }

        // Hide unnecesery titles too
        // TODO: Rewrite this
        if (screen1Height <= 400) {
            contentTitle.classList.add('hidden');
            consoleTitle.classList.add('hidden');
        } else {
            contentTitle.classList.remove('hidden');
            consoleTitle.classList.remove('hidden');
        }

        // Check width at first
        if (screen1Width >=0 && screen1Width < 600) {
            // Interface-only
            setFlipperView(0);
            return useSplitscreen;
        } else if (flipperView != 0 && screen1Width >=600 && screen1Width < 800) {
            // Device-only
            setFlipperView(1);
            return useSplitscreen;
        }

        // Check height
        if (screen1Height >= 0 && screen1Height < 320) {
            // Interface-only
            setFlipperView(0);
            return useSplitscreen;
        } else if (screen1Height >= 320 && screen1Height < 560) {
            // Device-only
            setFlipperView(1);
            return useSplitscreen;
        } else if (screen1Height >= 560) {
            // Full
            setFlipperView(2);
            return useSplitscreen;
        }

        setFlipperView(2);
        return useSplitscreen;
    }


    // Splitscreen
    const splitScreen = function() {
        let useSplitscreen = adaptView();

        mergeScreen();

        if (useSplitscreen) {
            window.splitscreen = Split(['#screen-1', '#screen-2'], {
                sizes: [
                    screen1.offsetHeight / document.body.offsetHeight * 100,
                    screen2.offsetHeight / document.body.offsetHeight * 100,
                ],
                minSize: [200, 400],
                direction: 'vertical',
                onDrag: adaptView
            });

            window.splitted = true;

            adaptView();
        }
    }

    const mergeScreen = function() {
        if (window.splitted) {
            window.splitscreen.destroy();
            window.splitted = false;
        }
    }


    // Init Device
    const initDevice = async function() {
        splitScreen();
        startStream();

        const body = new URLSearchParams();
        body.append('act', 'defaults');

        const request = new Request(config.apiUrl, {
            method: 'POST',
            body
        });

        let response = await fetch(request);
        response = await response.json();

        insertLogItem('testbench', response.data);
    }


    // Fullscreen
    fullscreenToggles.forEach(fullscreenToggle => {
        fullscreenToggle.addEventListener('click', function() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            }
        });
    });

    document.addEventListener('fullscreenchange', (event) => {
        const className = 'fullscreen-toggle--active';
        if (document.fullscreenElement) {
            fullscreenToggle.classList.add(className);
        } else {
            fullscreenToggle.classList.remove(className);
        }
    });


    // Checks
    filterCheckboxes.forEach(filterCheckbox => {
        filterCheckbox.addEventListener('change', function() {
            log.scrollTop = log.scrollHeight;
        });
    });


    // Uplooad
    uploadButtons.forEach(uploadButton => {
        uploadButton.addEventListener('click', function() {
            // Not logged in
            if (!config.token) return;

            uploadSelector.click();
        });
    });


    // Reset
    resetButton.addEventListener('click', function() {
        sendCommand('btn', {
            btn: 'reset',
            state: 'click'
        });
    });


    // Commands
    const sendCommand = async function(action, data) {
        // Not logged in
        if (!config.token) return;

        const body = new FormData();
        body.append('act', action);
        body.append('auth', config.token);
        body.append('data', JSON.stringify(data));

        const request = new Request(config.apiUrl, {
            method: 'POST', 
            body: body
        });

        let response = await fetch(request);
        response = await response.json();

        if (response.err === 2) {
            // Wrong token passed
            deauthorize();
        }

        return response;
    }


    // Upload firmware
    const uploadFirmware = async function(event) {
        // Not logged in
        if (!config.token) return;

        const body = new FormData();
        body.append('act', 'firmware_flash');
        body.append('firmware_addr', '0x08000000');
        body.append('firmware_bin', event.target.files[0]);
        body.append('auth', config.token);

        const request = new Request(config.apiUrl, {
            method: 'POST', 
            body: body
        });

        let response = await fetch(request);

        console.log(response.body);

        return response;
    }


    // Server Events
    const evtSource = new EventSource(config.sseUrl);

    evtSource.onmessage = function(event) {
        // console.log(event.data);
        if (!event.data) return;

        try {
            const data = JSON.parse(event.data);
            insertLogItem(data.type, data.data, data.ts);
        } catch {
            insertLogItem('error', event.data);
        }
    }

    evtSource.onerror = function(event) {
        console.error(event);
    }


    // Log
    const insertLogItem = function(type, data, time) {
        // Do not autoscroll if scrolled manually
        // const shouldScroll = true;
        // const shouldScroll = log.scrollTop === log.scrollHeight - log.offsetHeight;
        // 50 px gap need to fix mobile FF & Chrome skips calculations ¯\_(ツ)_/¯ 
        const shouldScroll = (log.scrollHeight - log.offsetHeight) - log.scrollTop < 50;

        const message = document.createElement('div');
        message.classList.add('message', `message--${type}`);
        message.innerText = JSON.stringify(data);

        console.log(time);

        if (!time) {
            time = Math.floor(Date.now() / 1000);
        }



        const timestamp = document.createElement('div');
        timestamp.classList.add('message__timestamp');
        timestamp.innerText = formatTime(time);
        message.prepend(timestamp);


        log.append(message);

        if (shouldScroll) {
            log.scrollTop = log.scrollHeight;
        }
    }


    // Display
    const startStream = function() {
        if (typeof window.player !== "undefined") {
            if (window.player != null) {
                window.player.unload();
                window.player.detachMediaElement();
                window.player.destroy();
                window.player = null;
            }
        }

        window.player = flvjs.createPlayer({
            type: 'flv',
            url: config.videoUrl,
        }, {
            enableWorker: false,
            lazyLoadMaxDuration: 1 * 60,
            seekType: 'range',
        });

        window.player.attachMediaElement(flipperLCD);
        window.player.load();
        window.player.play();
    }

    // LED
    let ledTimeout;

    const blinkLed = function() {
        ledEl.classList.remove('light-green');
        ledEl.classList.add('light-red');
        clearTimeout(ledTimeout);
        ledTimeout = setTimeout(() => {
            ledEl.classList.remove('light-red');
            ledEl.classList.add('light-green');
        }, 100);
    }


    // Buttons
    const pushState = function(target) {
        target.classList.add('pushed');
    }

    const tiltState = function(target, side) {
        target.classList.add('tilt-' + side);
    }

    const cleanState = function(target) {
        target.classList.remove('pushed', 'tilt-up', 'tilt-down', 'tilt-left', 'tilt-right');
    }


    const pushButtons = {};

    ['back', 'ok'].forEach(action => {
        pushButtons[action] = {
            zone: document.querySelector(`#flipper__button-${action}`),
            view: document.querySelector(`#flipper__button-${action}__view`)
        };

        pushButtons[action].zone.addEventListener('click', function() {
            // console.log(`Pushed ${action}!`);
            blinkLed();
            sendCommand('btn', {
                btn: action,
                state: 'click'
            })
        });

        ['mousedown', 'touchstart'].forEach(event => {
            pushButtons[action].zone.addEventListener(event, () => {
                pushState(pushButtons[action].view);
            });
        });

        ['mouseup', 'mouseout', 'touchend'].forEach(event => {
            pushButtons[action].zone.addEventListener(event, () => {
                cleanState(pushButtons[action].view);
            });
        })
    });

    const discNavigatorButtons = {};

    ['up', 'right', 'down', 'left'].forEach(side => {
        discNavigatorButtons[side] = document.querySelector(`#flipper__button-${side}`);

        discNavigatorButtons[side].addEventListener('click', function() {
            // console.log(`Move ${side}!`);
            blinkLed();
            sendCommand('btn', {
                btn: side,
                state: 'click'
            })
        });

        ['mousedown', 'touchstart'].forEach(event => {
            discNavigatorButtons[side].addEventListener(event, () => {
                tiltState(discNavigator, side);
            });
        });

        ['mouseup', 'mouseout', 'touchend'].forEach(event => {
            discNavigatorButtons[side].addEventListener(event, () => {
                cleanState(discNavigator);
            });
        })

    });


    // Local Events
    consoeInputForm.addEventListener('submit', submitCommandline);
    uploadSelector.addEventListener('change', uploadFirmware);


    // Let's go
    initDevice();


    // Global Events
    document.addEventListener('visibilitychange', startStream);
    window.addEventListener('resize', splitScreen);

})();
