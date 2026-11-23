# 풍경 시계

사진 위에 24시간제 현재 시각과 날짜를 표시합니다. 사진 네 장이 20초마다 순서대로 바뀝니다. 하단에서 사진 선택과 일시 정지, 상단에서 전체 화면 전환이 가능합니다.

## 라즈베리파이에서 실행

Raspberry Pi OS Lite에서 모니터와 키보드를 연결하고 텍스트 콘솔에 로그인합니다. 처음 한 번은 Cage와 Chromium을 설치합니다.

```sh
sudo apt update && sudo apt install cage chromium
```

프로젝트 폴더를 라즈베리파이에 복사한 뒤, 그 폴더에서 일반 사용자로 실행합니다.

```sh
python3 start.py
```

웹 서버가 시작되고 Cage가 Chromium을 전체 화면으로 띄웁니다. 종료하려면 `Ctrl+Alt+F2`로 다른 콘솔에 들어가 로그인한 뒤, 실행할 때 터미널에 출력된 `kill` 명령을 입력합니다. [Cage 실행 방식](https://github.com/cage-kiosk/cage)

시각은 브라우저를 실행한 기기의 시스템 시각과 시간대를 따릅니다. 설치 후에는 사진과 글꼴을 포함한 시계 화면이 인터넷 연결 없이 표시됩니다.

## 같은 네트워크에서 접속

다른 기기의 브라우저로 시계를 열려면 프로젝트 폴더에서 웹 서버를 실행합니다.

```sh
python3 -m http.server 8000 --directory public
```

브라우저로 `http://라즈베리파이_IP:8000`을 엽니다. 라즈베리파이에서 `hostname -I`로 주소를 확인하고, `Ctrl+C`로 서버를 종료할 수 있습니다.

## 사진과 전환 간격 변경

`public/photos/`에 사진을 넣고 `public/index.html`의 `.landscape` 이미지 목록에서 `src`, `data-name`, `data-region`을 바꿉니다. `public/clock.js`의 `photoInterval`은 밀리초 단위입니다.

## 사진 출처

- 모레인 호수 · [Joshua Woroniecki](https://unsplash.com/photos/o5nOR7XVPZw)
- 로카곶 · [Ivan Jenic](https://unsplash.com/photos/mEIOTXJdcuQ)
- 소수스블레이 · [Jules Bassoleil](https://unsplash.com/photos/fZ7yYZIJcqA)
- 취리히호 · [Christopher Politano](https://unsplash.com/photos/b3tCTbTfqdY)

사진은 [Unsplash 라이선스](https://unsplash.com/license)를 따릅니다. 글꼴 라이선스는 `public/fonts/`에 있습니다.
