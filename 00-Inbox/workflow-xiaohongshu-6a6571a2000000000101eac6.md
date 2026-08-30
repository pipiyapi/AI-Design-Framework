---
id: "workflow-xiaohongshu-6a6571a2000000000101eac6"
type: "workflow"
title: "VibeCoding教程：让角色跟着鼠标转头"
status: "inbox"
review_status: "pending"
analysis_status: "distilled"
source_platform: "xiaohongshu"
source_url: "https://xhslink.cn/o/6xTqhVG7Mgt"
canonical_url: "https://www.xiaohongshu.com/explore/6a6571a2000000000101eac6"
platform_id: "6a6571a2000000000101eac6"
author: "觉之设计"
evidence_file: "_evidence/tutorials/workflow-xiaohongshu-6a6571a2000000000101eac6/evidence.json"
evidence_quality: "partial"
evidence_coverage: ["title, author, body, duration and canonical URL","visible tutorial video steps and implementation formula","useful author replies about tools, eye motion, quality and alternatives"]
missing_evidence: ["downloaded source video","machine-generated full transcript","stored timestamped keyframe images","comments hidden behind login"]
outcome: "A hero character turns continuously in response to horizontal pointer movement."
capability_slots: ["image-generation","video-generation","frontend-generation"]
tags: []
suggested_tags: ["character-interaction","pointer-scrubbing","video-as-state","interactive-hero"]
works_for: ["brand-led","desktop-first","low-density","interactive-hero"]
avoid_for: ["content-heavy","high-density","performance-sensitive"]
confidence: 0.88
content_hash: "5dc3c6d98fe7e9b1ad6333b92b7400de00842a44a282bdcded52678f64d05a99"
created_at: "2026-08-30T09:35:00.000Z"
updated_at: "2026-08-30T09:35:00.000Z"
---

# VibeCoding教程：让角色跟着鼠标转头

## Outcome

A hero character turns continuously in response to horizontal pointer movement.

## Evidence coverage

- title, author, body, duration and canonical URL
- visible tutorial video steps and implementation formula
- useful author replies about tools, eye motion, quality and alternatives

Missing: downloaded source video, machine-generated full transcript, stored timestamped keyframe images, comments hidden behind login

## Distilled method

1. **Design endpoint states** — Create two images with identical identity, framing, background and lighting; change only the intended head and eye direction. (Input: character art direction · Output: left/right endpoint images)
2. **Generate one continuous transition** — Use the endpoints as first and last frames. Require natural synchronized eye and head rotation, stable identity and a locked camera. (Input: endpoint images · Output: short reversible transition clip)
3. **Treat video time as interaction state** — Disable autoplay. On horizontal pointer movement, map normalized delta to a target video time using sensitivity and clip duration. (Input: pointer delta and current video time · Output: target playback time)
4. **Protect the seek pipeline** — Clamp the target to the clip range and queue updates until seeking finishes so rapid mouse events do not flood the decoder. (Input: target time · Output: stable scrubbing)
5. **Tune and degrade gracefully** — Adjust sensitivity, preload a poster, test performance, and provide a non-interactive fallback for touch, reduced-motion or weak devices. (Input: rendered page · Output: production-ready interaction)

## Capability mapping

- `image-generation`: Codex Image Generation (default)
- `video-generation`: Jimeng CLI → Seedance 2.0/2.5 (approval required)
- `frontend-generation`: select by current project capability

## Success criteria

- character identity, framing, background and lighting remain stable
- eyes and head rotate together without a dead or sliding gaze
- pointer reversal produces an immediate and believable reverse turn
- seeking remains responsive without flicker, stalls or event flooding
- the page has a clear poster or static fallback before the video is ready

## Failure modes

- endpoint images differ in pose, composition or lighting and cause a morphing jump
- only the head rotates while the eyes remain fixed
- camera motion or background drift makes scrubbing feel detached from the pointer
- every mousemove writes currentTime immediately and overwhelms seeking
- high-resolution video becomes the hero bottleneck on mobile or low-power devices

## Prompt recipe

Preserve character identity, framing, lighting and background. Animate only a smooth horizontal head turn with synchronized natural eye movement. Keep the camera locked, motion continuous and endpoints exact; avoid blinking artifacts, facial morphing, background drift and extra body motion.

## Reuse notes

Use video scrubbing when the interaction is visually rich but has one continuous axis and a simple implementation is valuable. Prefer Rive, sprites or a real-time animation system when finer state control, transparency, resolution independence or frequent branching is required.

## Provenance

Raw evidence: [[_evidence/tutorials/workflow-xiaohongshu-6a6571a2000000000101eac6/evidence.json]]
