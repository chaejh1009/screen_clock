# 풍경 시계

사진 위에 24시간제 현재 시각과 날짜, 촬영지를 표시합니다. 시간과 영문 지역명에는 주황색 Jost 글꼴을 사용합니다. 풍경 일곱 장 사이에 훈련생을 위한 블로그 회고 안내 두 장이 20초 간격으로 나타나며, 안내 중에도 현재 시각을 볼 수 있습니다. [Jost 글꼴](https://github.com/indestructible-type/Jost)

## 라즈베리파이에서 실행

Raspberry Pi OS Lite에서 모니터와 키보드를 연결하고 텍스트 콘솔에 로그인합니다. 처음 한 번은 Cage와 Chromium을 설치합니다.

```sh
sudo apt update && sudo apt install cage chromium
```

프로젝트 폴더를 라즈베리파이에 복사한 뒤, 그 폴더에서 일반 사용자로 실행합니다.

```sh
python3 start.py
```

웹 서버가 시작되고 Cage가 Chromium을 전체 화면으로 띄웁니다. [Cage 실행 방식](https://github.com/cage-kiosk/cage)

`Esc`를 누르거나 화면 오른쪽 위의 **종료** 버튼을 누르면 브라우저와 웹 서버가 닫히고 콘솔로 돌아갑니다.

시각은 브라우저를 실행한 기기의 시스템 시각과 시간대를 따릅니다. 사진과 글꼴, 기본 회고 안내가 포함되어 인터넷 연결 없이도 화면이 표시됩니다.

## 회고 안내 동기화

GitHub `main`의 `public/review.json`을 수정하면 키오스크 서버가 시작할 때와 실행 중 10분마다 새 안내를 가져옵니다. 시작 직후에는 동봉된 안내를 사용할 수 있고, 갱신에 실패하면 현재 안내를 계속 표시합니다. 새 안내는 다음 회고 장면에서 표시됩니다.

`project`에 작성 항목을, `publication`에 발행 기준을 적습니다. 제목 예시를 표시하려면 `publication.title`에 문구를 넣습니다.

## 같은 네트워크에서 접속

다른 기기의 브라우저로 시계를 열려면 프로젝트 폴더에서 웹 서버를 실행합니다.

```sh
python3 -m http.server 8000 --directory public
```

브라우저로 `http://라즈베리파이_IP:8000`을 엽니다. 라즈베리파이에서 `hostname -I`로 주소를 확인하고, `Ctrl+C`로 서버를 종료할 수 있습니다.

## 사진과 전환 간격 변경

`public/photos/`에 사진을 넣고 `public/index.html`의 `.landscape` 이미지 목록에서 `src`, `data-place`, `data-name`, `data-region`을 바꿉니다. `data-tone`에는 밝은 사진의 `daylight`나 어두운 사진의 `twilight`를 지정할 수 있습니다. `public/clock.js`의 `photoInterval`은 밀리초 단위입니다.

## 사진 출처

- 모레인 호수 · [Joshua Woroniecki](https://unsplash.com/photos/o5nOR7XVPZw)
- 로카곶 · [Ivan Jenic](https://unsplash.com/photos/mEIOTXJdcuQ)
- 소수스블레이 · [Jules Bassoleil](https://unsplash.com/photos/fZ7yYZIJcqA)
- 프로젝트 회고 노트 · [Clay Banks](https://unsplash.com/photos/n9AaeihA9HI)
- 취리히호 · [Christopher Politano](https://unsplash.com/photos/b3tCTbTfqdY)
- 제주 성산의 해안 · [N Riazi](https://unsplash.com/photos/RjD376jWJXQ)
- 키르큐펠의 오로라 · [Landon Arnold](https://unsplash.com/photos/PMdiRXbAbhY)
- 레드우드 숲 · [Zetong Li](https://unsplash.com/photos/iFTqbA-TGhs)
- 블로그 회고 작업 책상 · [Yen Vu](https://unsplash.com/photos/WroKnBdKWSI)

사진은 [Unsplash 라이선스](https://unsplash.com/license)를 따릅니다. 글꼴 라이선스는 `public/fonts/`에 있습니다.
