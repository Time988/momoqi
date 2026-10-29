# 屈佳佳专用摸摸器 🐾

一个「摸头」交互小页：手机上用手指划过头顶，角色会抖动、脸红、冒心心、冒台词、发出呼噜声。

## 打开

现在已经在跑了：

- **固定链接（GitHub Pages，推荐）**：https://time988.github.io/momoqi/
- 临时隧道（备用，随时会失效）：见 `bash start.sh` 输出
- 本机：http://127.0.0.1:8787
- 同一 WiFi：http://你的内网IP:8787

## 以后重新开

```bash
bash pet/start.sh
```

- 已经在跑：只打印当前公网链接（并自动复制到剪贴板），不会重复起进程
- 没在跑：起服务 + 申请新链接，等 5~10 秒打印 `https://xxx.trycloudflare.com`

关掉终端窗口不影响运行；**关机 / 重启后链接会变**，再执行一次上面的命令把新链接发过去。

## 彩蛋

| 触发 | 内容 |
|---|---|
| 累计 99 / 199 / 299…（每满 99） | 金色闪光 + 心形迸发 + 「♥ N 次纪念」徽章 + 专属台词（三句轮换，带金色气泡） |
| 累计 520 | 告白流程：暖色遮罩 + 心形雨 + 角色头像 + 背景音乐 + 6 句分层台词 → 【不愿意】(红) / 【我愿意】(绿)。点红会求一次（按钮缩小、绿键放大），只有点绿才进入下一幕，结束后点「继续摸头」恢复计数 |
| 累计 9999 | 终极彩蛋（占位）：一万次时弹出「已经摸了一万次了，什么时候嫁给我呀」 |

告白成功后会写入 `localStorage.confess = yes`，不会重复触发；若中途关掉页面，10 分钟后再次摸头会重新弹出。

## 文件

- `index.html` —— 全部逻辑（无依赖、不用打包、不用服务器）
- `assets/pet.jpg` —— 角色图（换成同尺寸方图即可，路径保持 assets/pet.jpg）
- `assets/confession.m4a` —— 告白背景音乐（30 秒循环，numpy 合成后编码，可换成自己的曲子）
- `corpus-draft.md` —— 语料库定稿（页面里的台词来源）
- `bin/cloudflared` —— 打洞工具（Cloudflare 官方二进制）
- `start.sh` —— 一键启动

## 可调的地方（都在 index.html 里）

- 台词：`LINES` 对象，`start / pat / rub / gentle / idle / many / miss / care` 八种场景
- 思念·关心台词出现的概率：`pickMix(base, extra, p)` 里的 `p`（各调用点）
- 动作幅度：`:root` 里 `--press` 相关的 `scaleX / scaleY`
- 摸摸进度条满格次数：`Math.min(1, S.pats / 60)`
- 呼噜音色/音量：`Sound.init` 里两个 `lowpass.frequency` 与 `purr()` 里的 `0.2`

## 更新线上版本

```bash
cd pet && git add -A && git commit -m "update" && git push
```

GitHub Pages 会自动重建（约 1 分钟），链接不变。

## 注意

- 主链接是 GitHub Pages，永久不变、不依赖这台电脑开机；`start.sh` 的临时隧道只当备用。
- 仓库是公开的：https://github.com/Time988/momoqi —— 已加 `noindex` + `robots.txt` 不让搜索引擎收录。
- 角色图已用 OpenCV inpaint 去掉右下角水印，仅作私人分享。
