# AI 모델 분석: 전달받은 모델 파일 확인 결과

- 작성일: 2026-09-04
- 작성자: 박기호 (BE / AI 서비스 통합)
- 대상 파일: `AI모델.zip` (확인 시점에 다운로드 진행 중, 1.5GB+ / 최종 크기 미상)
- 확인 방법: 무압축(store) zip이라 앞부분 242MB를 직접 추출해 소스코드와 가중치 파일을 읽음. Docker tar는 미확인

> **중요:** 이 zip의 모델은 `AI 모델 환경 설치가이드.pdf`(2022.01, YOLOv3 + gaze-angle + RITnet)와 **다른 세트**다. zip은 NIA 2022 베이스라인(L2CS-Net + Former-DFER + RIT-Net)이다. PDF의 YOLOv3와 gaze-angle 코드는 zip에 없다. **서빙 대상은 zip 기준으로 잡는다.**

---

## 1. zip 구성

| 폴더 | 내용 | 크기 |
|---|---|---|
| `1. AI 모델 소스코드/Former-DFER_check-master/` | 감정 인식 모델 소스 + 검증 스크립트 | 소스만 |
| `1. AI 모델 소스코드/L2CS-Net_check-master/` | 시선 추정 모델 소스 + 검증 스크립트 | 소스만 |
| `1. AI 모델 소스코드/RIT-Net_check-master/` | 안구 영역 분할 모델 소스 + 가중치 | 1MB |
| `2. 학습 모델 파일/former_trained.pth` | Former-DFER 학습 가중치 | 144MB |
| `2. 학습 모델 파일/l2cs_trained.pkl` | L2CS-Net 학습 가중치 | 96MB |
| `2. 학습 모델 파일/trained_rit.pkl` | RIT-Net 학습 가중치 | 1MB |
| `3. 모델 구축 도커 이미지/nia_demo_dfer.tar` | 데모용 Docker 이미지 | 4GB 이상 (zip64), 미확인 |

세 모델 모두 **검증(validation) 스크립트만** 있고, 학습 스크립트와 프레임 1장 추론 함수는 없다. 데이터셋 폴더와 라벨 파일을 읽어 정확도를 출력하는 구조다.

---

## 2. 감정 모델: Former-DFER

동영상 기반 표정 인식 트랜스포머 (Zhao & Liu, ACM MM 2021). NIA 데이터로 재학습된 가중치.

| 항목 | 확인 내용 | 근거 |
|---|---|---|
| 구조 | ResNet18형 CNN → 공간 트랜스포머(S-Former) → 시간 트랜스포머(T-Former) → `fc(512, 5)` | `models/ST_Former.py`, `S_Former.py`, `T_Former.py` |
| **입력** | **16프레임 시퀀스**. 8개 구간에서 연속 2프레임씩 추출. 각 프레임은 얼굴 크롭 112×112 RGB | `dataloader/dataset_NIA.py` `num_segments=8, duration=2, image_size=112` |
| 전처리 | 리사이즈 112 → 0~1 스케일(`/255`). **mean/std 정규화 없음** | `custom_data_loader`: `GroupResize → Stack → ToTorchFormatTensor` |
| 텐서 형태 | `(B, 16, 3, 112, 112)` → 내부에서 `(B*16, 3, 112, 112)`로 reshape | `dataset_NIA.py` `torch.reshape(images, (-1, 3, 112, 112))` |
| **출력** | **5클래스 logit**. softmax 미적용 | `ST_Former.py` `nn.Linear(512, 5)` |
| 클래스 이름 | **코드에 없음.** 기획서의 7개 감정(기쁨, 당황, 분노, 불안, 상처, 슬픔, 중립)과 개수가 다름 | 라벨 파일 미포함 |
| 가중치 형식 | `{'epoch', 'state_dict'}` 딕셔너리. 키에 `module.` 접두사(DataParallel) | `former_trained.pth` 내부 `data.pkl` 검사 |
| 의존성 | PyTorch (원본 요구 1.8.0), `einops`. CUDA 호출이 코드에 하드코딩되어 있으나 구조상 CPU 실행 가능 | `valid_nia.py`, `README.md` |
| 학습 데이터 힌트 | 얼굴 크롭이 **PNG 프레임으로 미리 잘려 있는** 폴더 구조. 크롭 규칙은 코드에 없음 | `dataset_NIA.py` `glob(record.path/'*.png')` |

**서빙 함의**
- 프레임 1장이 아니라 **16프레임 묶음**을 넣어야 한다. 실시간에서는 슬라이딩 윈도우로 최근 프레임을 모아 주기적으로 추론한다. 3fps라면 약 5초 분량이 16프레임이다.
- 정규화가 `/255`뿐이라 전처리가 단순하다.
- 5클래스 이름을 AI 팀에서 받아야 리포트를 만들 수 있다. 이게 없으면 출력을 해석할 수 없다.

## 3. 시선 모델: L2CS-Net

얼굴 이미지에서 시선 각도(yaw, pitch)를 회귀하는 모델. NIA 2022 데이터로 학습.

| 항목 | 확인 내용 | 근거 |
|---|---|---|
| 구조 | **ResNet50** 백본 + yaw/pitch 각각 90-bin 분류 헤드 | `l2cs/model.py`, 가중치에 `layer1.0.conv3`(Bottleneck) 존재 확인 |
| **입력** | **얼굴 크롭** 1장, RGB, `Resize(448)`, ImageNet mean/std 정규화 | `run_valid_l2cs.py` transformations |
| 전처리 수치 | mean `[0.485, 0.456, 0.406]`, std `[0.229, 0.224, 0.225]` | 동일 |
| **출력** | yaw, pitch 각각 90-bin logit → softmax 기대값 → `×4 − 180` 으로 **각도(도)** 변환. 즉 **연속 각도**, 화면 좌표 아님 | `run_valid_l2cs.py` 후처리 |
| 가중치 형식 | 순수 `state_dict` (접두사 없음) | `l2cs_trained.pkl` 검사 |
| 의존성 | torch ≥ 1.10, torchvision, opencv, Pillow | `requirements.txt` |
| 학습 데이터 힌트 | 라벨 파일 한 줄 = `얼굴이미지경로 이름 pitch,yaw`. 얼굴 크롭은 **미리 잘려 있음**, 크롭 규칙 미상 | `l2cs/datasets.py` `NIA2022` |

**서빙 함의**
- 출력이 각도이므로 **"시선 이탈"을 각도 임계값으로 정의**할 수 있다. 예: `|yaw| > 20°` 또는 `|pitch| > 15°`가 3초 지속. 화면 좌표 변환과 캘리브레이션은 **불필요**할 가능성이 높다.
- 입력 448이 커서 CPU 추론이 무겁다. 224로 줄이면 빨라지지만 정확도 변화를 측정해야 한다.
- 얼굴 검출기는 별도로 붙여야 한다. 원저자 구현은 RetinaFace를 쓰지만 MediaPipe로 대체 가능. 학습 시 크롭 여백 규칙을 AI 팀에 확인해야 한다.

## 4. 안구 분할 모델: RIT-Net

눈 이미지에서 배경, 공막, 홍채, 동공을 픽셀 단위로 분리하는 DenseNet 기반 segmentation.

| 항목 | 확인 내용 | 근거 |
|---|---|---|
| 구조 | `DenseNet2D(dropout=True, prob=0.2)` | `ritnet/models.py` |
| 입력 | **흑백(L)** 눈 이미지, 400×640으로 리사이즈, CLAHE 적용, `Normalize([0.5],[0.5])` | `ritnet/dataset.py` |
| 출력 | 픽셀별 클래스 맵 | `ritnet/utils.py` `get_predictions` |
| 가중치 형식 | 구형 pickle(torch 1.0.1 시절), Python 3.6 환경 | `environment.yml`, 파일 헤더 |
| 성능 | mIoU 87.5 (설치가이드 기준) | PDF |

**서빙 함의**
- SelfFit의 시선 판정은 L2CS-Net이 얼굴에서 직접 각도를 내므로 **RIT-Net은 필요 없다.** 눈 감음이나 깜빡임 감지에 쓸 수는 있지만 MVP 범위 밖이다.
- 구형 torch로 저장된 pickle이라 최신 torch에서 로드가 안 될 수 있다. 쓰지 않는 쪽을 권한다.

---

## 5. 서빙 구조에 대한 결론

```
웹캠 프레임 (FE, 3fps, 다운스케일)
   │
   ▼
얼굴 검출 + 크롭 (MediaPipe, BE 또는 FE)          ← 베이스라인에 없음, 새로 붙임
   │
   ├──▶ 112×112 /255 ──▶ 링 버퍼(16장) ──▶ Former-DFER ──▶ 5클래스 확률 (주기적, 예: 2초마다)
   │
   └──▶ 448×448 ImageNet 정규화 ──▶ L2CS-Net ──▶ yaw, pitch 각도 (매 프레임)
                                                     │
                                                     ▼
                                          이벤트 판정 (각도 임계값 × 지속 시간)
```

| 결정 | 내용 |
|---|---|
| 서빙 모델 | **2개**: L2CS-Net(시선) + Former-DFER(감정). RIT-Net 제외 |
| 얼굴 검출 | MediaPipe Face Detection 1개를 두 모델이 공유. 두 크기로 리사이즈 |
| 시선 이탈 판정 | 각도 임계값 기반. 캘리브레이션 없음 (AI 팀 확인 후 확정) |
| 감정 추론 주기 | 16프레임 슬라이딩 윈도우, 1~2초마다 1회 |
| 가중치 로드 | Former-DFER는 `module.` 접두사 제거 필요. L2CS는 그대로 |
| 메모리 우려 | 가중치 합 240MB, torch CPU 런타임 포함 시 **Render 무료 512MB 초과 가능성 큼.** ONNX Runtime 변환과 유료 티어 검토 필요 |
| 추론 시간 우려 | ResNet50@448 + 16프레임 트랜스포머를 CPU에서 돌리면 프레임당 1초 이상 나올 수 있음. **측정 후 결정** |

## 6. 이 확인으로 해결된 질문 (02-ai-team-questions.md 기준)

| 번호 | 답 |
|---|---|
| A-1 | 별도 모델 2개 |
| A-2 | 감정: ResNet18형 + 트랜스포머. 시선: ResNet50 |
| A-3 | zip 기준으로 L2CS-Net + Former-DFER. PDF의 YOLOv3/gaze-angle은 zip에 없음 |
| A-4 | 두 모델 모두 **얼굴 크롭** 입력. 눈 크롭 아님 (RIT-Net만 눈 크롭) |
| B-1 | 감정 112×112, 시선 448 |
| B-2 | RGB (PIL 기준) |
| B-3 | 감정 `/255`만, 시선 ImageNet mean/std |
| B-4 | NCHW |
| B-6 | 감정은 **16프레임 시퀀스**, 시선은 단일 프레임 |
| C-1 | 시선 출력은 **각도(yaw, pitch)**. 좌표도 라벨도 아님 |
| C-3 | 감정은 **5클래스**. 7개 아님. 이름 미상 |
| C-4 | 둘 다 logit. softmax는 서빙에서 적용 |
| C-6 | 각도 출력이라 캘리브레이션 불필요할 가능성 높음 |
| D-1 | PyTorch (감정 1.8 기준, 시선 1.10+) |
| D-3 | 감정 144MB, 시선 96MB |
| G-1 | 수신 완료 (다운로드 진행 중) |

## 7. 아직 남은 질문

1. **감정 5클래스의 이름과 인덱스 순서** (가장 급함. 없으면 출력 해석 불가)
2. 두 모델의 학습 데이터 얼굴 크롭 규칙 (검출기, 여백 비율)
3. AI 팀이 이 가중치를 **그대로 쓰는지, 재학습하는지**. 재학습이면 납품 시점
4. 단일 프레임/시퀀스 추론 함수화를 누가 하는지
5. ONNX 변환 가능 여부와 CPU 추론 시간 측정 여부
6. `nia_demo_dfer.tar` 안에 데모 파이프라인(얼굴 검출 포함)이 있는지. 다운로드 완료 후 백엔드가 직접 확인 가능
7. 샘플 입력 + 기대 출력 제공 가능 여부
