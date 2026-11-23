# 풍경 시계

사진 위에 24시간제 현재 시각과 날짜를 표시합니다. 사진 네 장이 20초마다 순서대로 바뀝니다. 하단에서 사진 선택과 일시 정지, 상단에서 전체 화면 전환이 가능합니다.

## 라즈베리파이에서 실행

이 폴더 전체를 라즈베리파이에 복사한 뒤, 프로젝트 폴더에서 실행합니다. Python 3 외에 설치할 패키지는 없습니다.

```sh
python3 -m http.server 8000 --directory public
```

- 라즈베리파이에 연결한 화면에서는 브라우저로 `http://localhost:8000`을 엽니다.
- 같은 네트워크의 다른 기기에서는 `http://라즈베리파이_IP:8000`을 엽니다. 라즈베리파이에서 `hostname -I`로 주소를 확인할 수 있습니다.
- 브라우저를 실행한 기기의 시스템 시각과 시간대를 사용합니다. 사진과 글꼴은 프로젝트에 포함되어 인터넷 연결 없이 표시됩니다.
- 서버를 종료하려면 실행한 터미널에서 `Ctrl+C`를 누릅니다.

## 사진과 전환 간격 변경

`public/photos/`에 사진을 넣고 `public/index.html`의 `.landscape` 이미지 목록에서 `src`, `data-name`, `data-region`을 바꿉니다. `public/clock.js`의 `photoInterval`은 밀리초 단위입니다.

## 사진 출처

- 모레인 호수 · [Joshua Woroniecki](https://unsplash.com/photos/o5nOR7XVPZw)
- 로카곶 · [Ivan Jenic](https://unsplash.com/photos/mEIOTXJdcuQ)
- 소수스블레이 · [Jules Bassoleil](https://unsplash.com/photos/fZ7yYZIJcqA)
- 취리히호 · [Christopher Politano](https://unsplash.com/photos/b3tCTbTfqdY)

사진은 [Unsplash 라이선스](https://unsplash.com/license)를 따릅니다. 글꼴 라이선스는 `public/fonts/`에 있습니다.
