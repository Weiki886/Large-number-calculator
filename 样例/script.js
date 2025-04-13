document.addEventListener('DOMContentLoaded', function() {
    // 元素引用
    const videoInput = document.getElementById('video');
    const formatSelect = document.getElementById('format');
    const filenameInput = document.getElementById('filename');
    const convertBtn = document.getElementById('convert-btn');
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress');
    const statusText = document.getElementById('status');
    const downloadContainer = document.getElementById('download-container');
    const downloadLink = document.getElementById('download-link');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    const logElement = document.getElementById('log');
    
    // 当选择视频文件时，自动填充文件名
    videoInput.addEventListener('change', function() {
        if (videoInput.files.length > 0) {
            // 获取文件名，不含扩展名
            const videoFileName = videoInput.files[0].name.split('.').slice(0, -1).join('.');
            // 如果用户尚未输入自定义文件名，则使用视频文件名
            if (!filenameInput.value) {
                filenameInput.value = videoFileName;
            }
        }
    });
    
    // 日志功能
    function log(message) {
        console.log(message);
        logElement.style.display = 'block';
        logElement.innerHTML += message + '<br>';
        logElement.scrollTop = logElement.scrollHeight;
    }
    
    // 点击转换按钮
    convertBtn.addEventListener('click', async function() {
        const videoFile = videoInput.files[0];
        const outputFormat = formatSelect.value;
        // 获取自定义文件名，如果为空则使用默认值
        let customFilename = filenameInput.value.trim();
        if (!customFilename) {
            customFilename = '音频文件';
        }
        
        // 验证文件名
        customFilename = sanitizeFilename(customFilename);
        
        // 验证输入
        if (!videoFile) {
            showError('请选择要转换的视频文件');
            return;
        }
        
        // 重置UI
        resetUI();
        progressContainer.style.display = 'block';
        convertBtn.disabled = true;
        
        try {
            // 使用HTML5音频API加载和转换音频
            log('开始处理视频文件：' + videoFile.name);
            statusText.textContent = '提取音频...';
            
            // 创建视频元素来加载视频
            const videoElement = document.createElement('video');
            videoElement.style.display = 'none';
            document.body.appendChild(videoElement);
            
            // 创建音频上下文
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const fileURL = URL.createObjectURL(videoFile);
            
            // 设置视频加载完成的处理函数
            videoElement.onloadedmetadata = function() {
                log('视频元数据加载完成，时长: ' + videoElement.duration + '秒');
                progressBar.style.width = '20%';
                statusText.textContent = '分析视频文件...';
            };
            
            // 设置视频可以播放的处理函数
            videoElement.oncanplay = async function() {
                try {
                    log('视频可以播放，开始提取音频');
                    progressBar.style.width = '40%';
                    statusText.textContent = '提取音频数据...';
                    
                    // 创建媒体源和音频节点
                    const source = audioContext.createMediaElementSource(videoElement);
                    const destination = audioContext.createMediaStreamDestination();
                    source.connect(destination);
                    
                    // 获取音频媒体轨道
                    const stream = destination.stream;
                    const audioTrack = stream.getAudioTracks()[0];
                    
                    // 检查是否有音频轨道
                    if (!audioTrack) {
                        throw new Error('无法从视频中提取音频轨道');
                    }
                    
                    // 创建MediaRecorder来录制音频
                    const options = { mimeType: getMimeType(outputFormat) };
                    let mediaRecorder;
                    
                    try {
                        mediaRecorder = new MediaRecorder(stream, options);
                    } catch (e) {
                        log('警告: 首选格式不受支持，使用默认格式');
                        mediaRecorder = new MediaRecorder(stream);
                    }
                    
                    const chunks = [];
                    
                    mediaRecorder.ondataavailable = function(e) {
                        if (e.data.size > 0) {
                            chunks.push(e.data);
                        }
                    };
                    
                    mediaRecorder.onstop = function() {
                        log('录制完成，准备下载');
                        
                        // 合并音频数据块
                        const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
                        const audioUrl = URL.createObjectURL(blob);
                        
                        // 设置下载链接，使用自定义文件名
                        downloadLink.href = audioUrl;
                        downloadLink.download = `${customFilename}.${outputFormat}`;
                        downloadLink.textContent = `下载 ${customFilename}.${outputFormat}`;
                        
                        // 清理和显示下载区域
                        URL.revokeObjectURL(fileURL);
                        document.body.removeChild(videoElement);
                        
                        progressBar.style.width = '100%';
                        statusText.textContent = '处理完成!';
                        downloadContainer.style.display = 'block';
                        showSuccess(`视频已成功转换为音频! 文件名: ${customFilename}.${outputFormat}`);
                        convertBtn.disabled = false;
                    };
                    
                    // 开始录制
                    progressBar.style.width = '60%';
                    statusText.textContent = '正在转换...';
                    mediaRecorder.start();
                    
                    // 播放视频以便录制音频
                    videoElement.play();
                    
                    // 设置录制结束时间
                    setTimeout(() => {
                        progressBar.style.width = '90%';
                        statusText.textContent = '完成录制...';
                        mediaRecorder.stop();
                        videoElement.pause();
                    }, videoElement.duration * 1000);
                    
                } catch (error) {
                    handleError(error, fileURL, videoElement);
                }
            };
            
            // 设置错误处理函数
            videoElement.onerror = function() {
                handleError(new Error('视频文件加载失败'), fileURL, videoElement);
            };
            
            // 加载视频
            videoElement.src = fileURL;
            
        } catch (error) {
            handleError(error);
        }
    });
    
    // 错误处理函数
    function handleError(error, fileURL, videoElement) {
        console.error('转换过程出错:', error);
        log('错误: ' + error.message);
        showError('转换失败: ' + error.message);
        
        // 清理资源
        if (fileURL) {
            URL.revokeObjectURL(fileURL);
        }
        if (videoElement && document.body.contains(videoElement)) {
            document.body.removeChild(videoElement);
        }
        
        convertBtn.disabled = false;
    }
    
    // 清理文件名，移除非法字符
    function sanitizeFilename(filename) {
        // 移除不允许用于文件名的字符
        return filename.replace(/[/\\?%*:|"<>]/g, '_');
    }
    
    // 辅助函数
    function getMimeType(format) {
        switch(format) {
            case 'mp3': return 'audio/mpeg';
            case 'wav': return 'audio/wav';
            case 'aac': return 'audio/aac';
            default: return ''; // 让浏览器选择最合适的类型
        }
    }
    
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';
    }
    
    function showSuccess(message) {
        successMessage.textContent = message;
        successMessage.style.display = 'block';
        errorMessage.style.display = 'none';
    }
    
    function resetUI() {
        progressBar.style.width = '0%';
        statusText.textContent = '';
        errorMessage.style.display = 'none';
        successMessage.style.display = 'none';
        downloadContainer.style.display = 'none';
        logElement.innerHTML = '';
        logElement.style.display = 'none';
    }
}); 