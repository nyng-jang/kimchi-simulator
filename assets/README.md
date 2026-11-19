# 재료 에셋

게임에서 쓰는 재료 3D 모델을 하나씩 분리해 저장한 폴더입니다.
게임 본체(`index.html`)는 같은 모델을 코드로 직접 만들어 쓰고, 이 폴더의 파일은 따로 보거나 다른 툴에서 쓰기 위한 사본입니다.

| 폴더 | 내용 |
|---|---|
| `ingredients/` | 손질 재료 15종 (기본 10 + 엉뚱 5) — `.glb` 3D 모델 + `.png` 썸네일 |
| `seasonings/` | 양념 12종 (양념통 모델) — `.glb` + `.png` |
| `manifest.json` | 재료 키, 이름, 분류, 맛 성분, 파일 경로 목록 |

- 형식: glTF Binary(.glb), 정점 색상(vertex color) 사용, 텍스처 없음
- 단위: 게임 씬 기준 (배추 길이 약 2.5)
- 열어보기: https://gltf-viewer.donmccurdy.com 등 glTF 뷰어, Blender(File → Import → glTF)
