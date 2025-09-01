export const demoHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Canvas CF Worker - Dynamic Font Sizing Demo</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }

        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            font-weight: 700;
        }

        .header p {
            opacity: 0.9;
            font-size: 1.1rem;
        }

        .content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            padding: 30px;
        }

        .controls {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        .form-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .form-group label {
            font-weight: 600;
            color: #2c3e50;
            font-size: 0.9rem;
        }

        .form-group input, .form-group textarea, .form-group select {
            padding: 12px 16px;
            border: 2px solid #e1e5e9;
            border-radius: 8px;
            font-size: 1rem;
            transition: border-color 0.2s ease;
        }

        .form-group input:focus, .form-group textarea:focus, .form-group select:focus {
            outline: none;
            border-color: #3498db;
        }

        .form-group textarea {
            resize: vertical;
            min-height: 80px;
            font-family: inherit;
        }

        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }

        .color-input {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .color-picker {
            width: 50px;
            height: 40px;
            border: 2px solid #e1e5e9;
            border-radius: 6px;
            cursor: pointer;
        }

        .checkbox-group {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-top: 5px;
        }

        .checkbox-group input[type="checkbox"] {
            width: 20px;
            height: 20px;
        }

        .button-group {
            display: flex;
            gap: 10px;
            margin-top: 10px;
        }

        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .btn-primary {
            background: #3498db;
            color: white;
        }

        .btn-primary:hover {
            background: #2980b9;
            transform: translateY(-1px);
        }

        .btn-secondary {
            background: #95a5a6;
            color: white;
        }

        .btn-secondary:hover {
            background: #7f8c8d;
        }

        .btn-random {
            background: #e74c3c;
            color: white;
        }

        .btn-random:hover {
            background: #c0392b;
        }

        .preview-section {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        .preview-container {
            border: 2px solid #e1e5e9;
            border-radius: 12px;
            padding: 20px;
            background: #f8f9fa;
            text-align: center;
            min-height: 400px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }

        .preview-image {
            max-width: 100%;
            max-height: 350px;
            border-radius: 8px;
            box-shadow: 0 8px 16px rgba(0,0,0,0.1);
        }

        .loading {
            color: #7f8c8d;
            font-style: italic;
        }

        .error {
            color: #e74c3c;
            background: #fdf2f2;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #fecaca;
        }

        .metrics {
            background: #e8f4f8;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #3498db;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.9rem;
        }

        .metrics h4 {
            margin-bottom: 10px;
            color: #2c3e50;
        }

        .sample-texts {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 10px;
        }

        .sample-text {
            background: #ecf0f1;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.85rem;
            cursor: pointer;
            transition: background 0.2s ease;
        }

        .sample-text:hover {
            background: #3498db;
            color: white;
        }

        @media (max-width: 768px) {
            .content {
                grid-template-columns: 1fr;
                gap: 20px;
            }
            
            .form-row {
                grid-template-columns: 1fr;
            }
            
            .button-group {
                flex-direction: column;
            }
        }

        .url-examples {
            font-size: 0.8rem;
            color: #7f8c8d;
            margin-top: 5px;
        }

        .url-examples a {
            color: #3498db;
            text-decoration: none;
        }

        .url-examples a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎨 Canvas CF Worker Demo</h1>
            <p>Dynamic Font Sizing with Text Measurement & Background Images</p>
        </div>
        
        <div class="content">
            <div class="controls">
                <div class="form-group">
                    <label for="text">Text Content</label>
                    <textarea id="text" placeholder="Enter your text here...">Hello, Dynamic Font Sizing!</textarea>
                    <div class="sample-texts">
                        <span class="sample-text" onclick="setText('John Doe')">John Doe</span>
                        <span class="sample-text" onclick="setText('Hello 🌍 World! 🎨')">Emojis</span>
                        <span class="sample-text" onclick="setText('مرحبا بالعالم')">Arabic</span>
                        <span class="sample-text" onclick="setText('你好世界')">Chinese</span>
                        <span class="sample-text" onclick="setText('🚀 Dynamic Font Sizing ⚡')">Mixed</span>
                        <span class="sample-text" onclick="setText('Christopher Alexander Johnson')">Long Name</span>
                        <span class="sample-text" onclick="setText('This is an extremely long piece of text that will require very small font sizes to fit properly within the layout constraints')">Very Long Text</span>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="width">Width (px)</label>
                        <input type="number" id="width" value="600" min="100" max="1200">
                    </div>
                    <div class="form-group">
                        <label for="height">Height (px)</label>
                        <input type="number" id="height" value="400" min="100" max="800">
                    </div>
                </div>

                <div class="form-group">
                    <label for="backgroundImageUrl">Background Image URL (optional)</label>
                    <input type="url" id="backgroundImageUrl" placeholder="https://example.com/image.jpg">
                    <div class="url-examples">
                        Try: <a href="#" onclick="setRandomBackground()">Random Image</a> • 
                        <a href="#" onclick="setBackground('https://picsum.photos/800/600')">Picsum</a> • 
                        <a href="#" onclick="setBackground('https://source.unsplash.com/800x600/?nature')">Unsplash Nature</a>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Text Color</label>
                        <div class="color-input">
                            <input type="color" id="textColorPicker" class="color-picker" value="#000000">
                            <input type="text" id="textColor" value="0,0,0,1" placeholder="R,G,B,A">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Background Color</label>
                        <div class="color-input">
                            <input type="color" id="bgColorPicker" class="color-picker" value="#ffffff">
                            <input type="text" id="bgColor" value="255,255,255,1" placeholder="R,G,B,A">
                        </div>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="maxTextWidth">Max Text Width (px)</label>
                        <input type="number" id="maxTextWidth" placeholder="Auto (80% of width)">
                    </div>
                    <div class="form-group">
                        <label for="fontSize">Manual Font Size (px)</label>
                        <input type="number" id="fontSize" placeholder="Auto-calculated">
                    </div>
                </div>

                <div class="checkbox-group">
                    <input type="checkbox" id="autoFontSize" checked>
                    <label for="autoFontSize">Enable Auto Font Sizing</label>
                </div>

                <div class="button-group">
                    <button class="btn btn-primary" onclick="generateImage()">🎨 Generate Image</button>
                    <button class="btn btn-secondary" onclick="downloadImage()">💾 Download</button>
                    <button class="btn btn-random" onclick="randomize()">🎲 Randomize All</button>
                </div>
            </div>

            <div class="preview-section">
                <div class="preview-container" id="previewContainer">
                    <p class="loading">Click "Generate Image" to see your design...</p>
                </div>
                
                <div id="metrics" style="display: none;">
                </div>
            </div>
        </div>
    </div>

    <script>
        const WORKER_URL = window.location.origin;
        let lastGeneratedImage = null;

        // Random backgrounds
        const randomBackgrounds = [
            'https://picsum.photos/800/600',
            'https://source.unsplash.com/800x600/?landscape',
            'https://source.unsplash.com/800x600/?nature',
            'https://source.unsplash.com/800x600/?ocean',
            'https://source.unsplash.com/800x600/?mountains',
            'https://source.unsplash.com/800x600/?forest',
            'https://source.unsplash.com/800x600/?sunset',
            'https://source.unsplash.com/800x600/?space',
        ];

        // Color picker sync
        document.getElementById('textColorPicker').addEventListener('change', function() {
            const hex = this.value;
            const rgb = hexToRgb(hex);
            document.getElementById('textColor').value = \`\${rgb.r},\${rgb.g},\${rgb.b},1\`;
        });

        document.getElementById('bgColorPicker').addEventListener('change', function() {
            const hex = this.value;
            const rgb = hexToRgb(hex);
            document.getElementById('bgColor').value = \`\${rgb.r},\${rgb.g},\${rgb.b},1\`;
        });

        function hexToRgb(hex) {
            const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        }

        function setText(text) {
            document.getElementById('text').value = text;
        }

        function setBackground(url) {
            document.getElementById('backgroundImageUrl').value = url;
        }

        function setRandomBackground() {
            const randomUrl = randomBackgrounds[Math.floor(Math.random() * randomBackgrounds.length)];
            setBackground(randomUrl);
        }

        function randomize() {
            const randomTexts = [
                'Amazing Design!',
                'Creative Typography',
                'John Smith',
                'This is a longer text example for testing',
                'Beautiful Layouts',
                'Dynamic Font Sizing',
                'Perfect Fit Every Time'
            ];
            setText(randomTexts[Math.floor(Math.random() * randomTexts.length)]);

            const widths = [400, 500, 600, 700, 800];
            const heights = [300, 400, 500, 600];
            document.getElementById('width').value = widths[Math.floor(Math.random() * widths.length)];
            document.getElementById('height').value = heights[Math.floor(Math.random() * heights.length)];

            const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
            const bgColors = ['#2C3E50', '#8E44AD', '#E74C3C', '#F39C12', '#27AE60', '#3498DB', '#E67E22'];
            
            const textColor = colors[Math.floor(Math.random() * colors.length)];
            const bgColor = bgColors[Math.floor(Math.random() * bgColors.length)];
            
            document.getElementById('textColorPicker').value = textColor;
            document.getElementById('bgColorPicker').value = bgColor;
            
            const textRgb = hexToRgb(textColor);
            const bgRgb = hexToRgb(bgColor);
            
            document.getElementById('textColor').value = \`\${textRgb.r},\${textRgb.g},\${textRgb.b},1\`;
            document.getElementById('bgColor').value = \`\${bgRgb.r},\${bgRgb.g},\${bgRgb.b},1\`;

            if (Math.random() > 0.5) {
                setRandomBackground();
            } else {
                document.getElementById('backgroundImageUrl').value = '';
            }
        }

        function parseColor(colorString) {
            const parts = colorString.split(',').map(s => parseFloat(s.trim()));
            return parts.length >= 3 ? parts : [0, 0, 0, 1];
        }

        async function generateImage() {
            const previewContainer = document.getElementById('previewContainer');
            const metricsDiv = document.getElementById('metrics');
            
            previewContainer.innerHTML = '<p class="loading">Generating image...</p>';
            metricsDiv.style.display = 'none';

            const data = {
                text: document.getElementById('text').value,
                width: parseInt(document.getElementById('width').value) || 600,
                height: parseInt(document.getElementById('height').value) || 400,
                backgroundImageUrl: document.getElementById('backgroundImageUrl').value || null,
                textColor: parseColor(document.getElementById('textColor').value),
                backgroundColor: parseColor(document.getElementById('bgColor').value),
                maxTextWidth: parseInt(document.getElementById('maxTextWidth').value) || null,
                fontSize: parseInt(document.getElementById('fontSize').value) || null,
                autoFontSize: document.getElementById('autoFontSize').checked
            };

            try {
                const response = await fetch(WORKER_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (result.success) {
                    lastGeneratedImage = result.image;
                    
                    previewContainer.innerHTML = \`
                        <img src="\${result.image}" alt="Generated Image" class="preview-image">
                    \`;

                    metricsDiv.innerHTML = \`
                        <div class="metrics">
                            <h4>📊 Image Metrics</h4>
                            <div><strong>Format:</strong> \${result.format.toUpperCase()}</div>
                            <div><strong>Dimensions:</strong> \${data.width} × \${data.height}px</div>
                            <div><strong>Text:</strong> "\${data.text.substring(0, 50)}\${data.text.length > 50 ? '...' : ''}"</div>
                            <div><strong>Auto Font Size:</strong> \${data.autoFontSize ? 'Enabled' : 'Disabled'}</div>
                            \${data.maxTextWidth ? \`<div><strong>Max Text Width:</strong> \${data.maxTextWidth}px</div>\` : ''}
                        </div>
                    \`;
                    metricsDiv.style.display = 'block';
                } else {
                    previewContainer.innerHTML = \`
                        <div class="error">
                            <strong>Error:</strong> \${result.error}
                        </div>
                    \`;
                }
            } catch (error) {
                previewContainer.innerHTML = \`
                    <div class="error">
                        <strong>Network Error:</strong> \${error.message}
                    </div>
                \`;
            }
        }

        function downloadImage() {
            if (!lastGeneratedImage) {
                alert('Please generate an image first!');
                return;
            }

            const link = document.createElement('a');
            link.download = \`canvas-generated-\${Date.now()}.png\`;
            link.href = lastGeneratedImage;
            link.click();
        }

        window.addEventListener('load', function() {
            setTimeout(generateImage, 1000);
        });
    </script>
</body>
</html>`;