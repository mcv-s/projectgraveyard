class ProjectGraveyard {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.plusButton = document.getElementById('plusButton');
        this.centerButton = document.getElementById('centerButton');
        this.shareButton = document.getElementById('shareButton');
        this.textButton = document.getElementById('textButton');
        this.lineButton = document.getElementById('lineButton');
        this.squareButton = document.getElementById('squareButton');
        this.sidebar = document.getElementById('sidebar');
        this.closeButton = document.getElementById('closeButton');
        
        // Delete buttons for each type
        this.deleteGraveButton = document.getElementById('deleteGraveButton');
        this.deleteTextButton = document.getElementById('deleteTextButton');
        this.deleteLineButton = document.getElementById('deleteLineButton');
        this.deleteSquareButton = document.getElementById('deleteSquareButton');
        
        // Canvas properties
        this.offsetX = 0;
        this.offsetY = 0;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.spacePressed = false;
        this.middleMousePressed = false;
        
        // Objects
        this.objects = [];
        this.selectedObject = null;
        this.hoveredObject = null;
        this.hoverDistance = 80;
        this.draggingObject = null;
        this.resizingLineEnd = null;
        this.resizingSquareCorner = null;
        
        // Mouse position
        this.mouseX = 0;
        this.mouseY = 0;

        this.dragOffsetX = 0;
        this.dragOffsetY = 0; 
        
        this.init();
    }
    
    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Load from URL if data exists
        this.loadFromURL();
        
        // Keyboard events
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Mouse events
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
        
        // Plus button
        this.plusButton.addEventListener('click', () => this.addObject());
        
        // Center button
        this.centerButton.addEventListener('click', () => this.centerViewOnObjects());
        
        // Share button
        this.shareButton.addEventListener('click', () => this.shareGraveyard());
        
        // Tool buttons
        this.textButton.addEventListener('click', () => this.addText());
        this.lineButton.addEventListener('click', () => this.addLine());
        this.squareButton.addEventListener('click', () => this.addSquare());
        
        // Sidebar
        this.closeButton.addEventListener('click', () => this.closeSidebar());
        this.deleteGraveButton.addEventListener('click', () => this.deleteSelectedObject());
        this.deleteTextButton.addEventListener('click', () => this.deleteSelectedObject());
        this.deleteLineButton.addEventListener('click', () => this.deleteSelectedObject());
        this.deleteSquareButton.addEventListener('click', () => this.deleteSelectedObject());
        
        // Form inputs - Grave
        document.getElementById('graveName').addEventListener('input', (e) => {
            if (this.selectedObject && this.selectedObject.type === 'grave') {
                this.selectedObject.name = e.target.value;
                this.render();
            }
        });
        
        document.getElementById('graveDescription').addEventListener('input', (e) => {
            if (this.selectedObject && this.selectedObject.type === 'grave') {
                this.selectedObject.description = e.target.value;
            }
        });
        
        document.getElementById('graveEmoji').addEventListener('input', (e) => {
            if (this.selectedObject && this.selectedObject.type === 'grave') {
                this.selectedObject.emoji = e.target.value || '🪦';
                this.render();
            }
        });

        // Form inputs - Text
        document.getElementById('textContent').addEventListener('input', (e) => {
            if (this.selectedObject && this.selectedObject.type === 'text') {
                this.selectedObject.content = e.target.value;
                this.render();
            }
        });

        document.getElementById('textSize').addEventListener('input', (e) => {
            if (this.selectedObject && this.selectedObject.type === 'text') {
                this.selectedObject.fontSize = parseInt(e.target.value) || 20;
                this.render();
            }
        });
        
        // Start animation loop
        this.animate();
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    handleKeyDown(e) {
        if (e.code === 'Space') {
            // Don't intercept space if typing in an input
            if (e.target === document.getElementById('projectName') || 
                e.target === document.getElementById('projectDescription')) {
                return;
            }
            this.spacePressed = true;
            this.canvas.classList.add('space-pressed');
        }
    }
    
    handleKeyUp(e) {
        if (e.code === 'Space') {
            // Don't intercept space if typing in an input
            if (e.target === document.getElementById('projectName') || 
                e.target === document.getElementById('projectDescription')) {
                return;
            }
            this.spacePressed = false;
            this.canvas.classList.remove('space-pressed');
        }
    }
    
    handleMouseMove(e) {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
        
        if (this.isDragging) {
            const deltaX = e.clientX - this.dragStartX;
            const deltaY = e.clientY - this.dragStartY;
            
            this.offsetX += deltaX;
            this.offsetY += deltaY;
            
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
        }
        
        // Drag object
        if (this.draggingObject) {
            const deltaX = e.clientX - this.dragStartX;
            const deltaY = e.clientY - this.dragStartY;
            
            this.draggingObject.x += deltaX;
            this.draggingObject.y += deltaY;
            
            if (this.draggingObject.type === 'line') {
                this.draggingObject.x2 += deltaX;
                this.draggingObject.y2 += deltaY;
            }
            
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
        }
        
        // Resize line endpoint
        if (this.resizingLineEnd) {
            const world = this.screenToWorld(e.clientX, e.clientY);
            const worldX = world.x;
            const worldY = world.y;
            
            if (this.resizingLineEnd.endpoint === 'start') {
                this.resizingLineEnd.obj.x = worldX;
                this.resizingLineEnd.obj.y = worldY;
            } else {
                this.resizingLineEnd.obj.x2 = worldX;
                this.resizingLineEnd.obj.y2 = worldY;
            }
        }
        
        // Resize square
        if (this.resizingSquareCorner) {
            const worldX = e.clientX - this.offsetX;
            const worldY = e.clientY - this.offsetY;
            
            this.resizingSquareCorner.width = Math.max(20, worldX - this.resizingSquareCorner.x);
            this.resizingSquareCorner.height = Math.max(20, worldY - this.resizingSquareCorner.y);
        }
        
        // Update hover state
        this.updateHoveredObject();
    }
    
    handleMouseDown(e) {
        // Middle mouse button (wheel) or space + left click
        if (e.button === 1 || (e.button === 0 && this.spacePressed)) {
            this.isDragging = true;
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
            this.canvas.classList.add('canvas-dragging');
            e.preventDefault();
        }
        
        // Left click - check for line endpoints first
        if (e.button === 0 && !this.spacePressed) {
            const lineEndpoint = this.getLineEndpointAtPoint(e.clientX, e.clientY);
            if (lineEndpoint) {
                this.resizingLineEnd = lineEndpoint;
                this.selectObject(lineEndpoint.obj);
                e.preventDefault();
                return;
            }
            
            // Check for square corners
            const squareCorner = this.getSquareCornerAtPoint(e.clientX, e.clientY);
            if (squareCorner) {
                this.resizingSquareCorner = squareCorner;
                this.selectObject(squareCorner);
                e.preventDefault();
                return;
            }
            
            // Check for clicking on a line (not endpoint)
            const lineObject = this.getLineAtPoint(e.clientX, e.clientY);
            if (lineObject) {
                this.draggingObject = lineObject;
                this.dragStartX = e.clientX;
                this.dragStartY = e.clientY;
                this.selectObject(lineObject);
                this.canvas.classList.add('object-dragging');
                e.preventDefault();
                return;
            }
            
            // Check for regular objects
            const clickedObject = this.getObjectAtPoint(e.clientX, e.clientY);
            if (clickedObject) {
                this.draggingObject = clickedObject;
                this.dragStartX = e.clientX;
                this.dragStartY = e.clientY;
                this.selectObject(clickedObject);
                this.canvas.classList.add('object-dragging');
                e.preventDefault();
            }
        }
    }
    
    handleMouseUp(e) {
        // Snap dragged object
        if (this.draggingObject) {
            this.draggingObject.x = this.snapToGrid(this.draggingObject.x);
            this.draggingObject.y = this.snapToGrid(this.draggingObject.y);

            if (this.draggingObject.type === 'line') {
                this.draggingObject.x2 = this.snapToGrid(this.draggingObject.x2);
                this.draggingObject.y2 = this.snapToGrid(this.draggingObject.y2);
            }
        }

        // 🔥 FIX: clear ALL interaction modes
        this.draggingObject = null;
        this.resizingLineEnd = null;
        this.resizingSquareCorner = null;
        this.isDragging = false;

        this.canvas.classList.remove('canvas-dragging', 'object-dragging');
    }
    
    handleWheel(e) {
        e.preventDefault();
        // Optional: Add zoom functionality
    }
    
    addObject() {
        // Spawn in center of screen
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        const world = this.screenToWorld(centerX, centerY);

        const newObject = {
            id: Date.now(),
            type: 'grave',
            name: `Project ${this.objects.length + 1}`,
            description: '',
            x: world.x,
            y: world.y,
            emoji: '🪦',
            size: 60
        };
        
        this.objects.push(newObject);
        this.updateCenterButtonVisibility();
        this.render();
    }
    
    addText() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        const newObject = {
            id: Date.now(),
            type: 'text',
            content: 'Text',
            x: centerX - this.offsetX,
            y: centerY - this.offsetY,
            fontSize: 20,
            color: '#ffffff'
        };
        
        this.objects.push(newObject);
        this.updateCenterButtonVisibility();
        this.selectObject(newObject);
        this.render();
    }
    
    addLine() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        const newObject = {
            id: Date.now(),
            type: 'line',
            x: centerX - this.offsetX - 50,
            y: centerY - this.offsetY,
            x2: centerX - this.offsetX + 50,
            y2: centerY - this.offsetY,
            color: '#667eea',
            width: 2
        };
        
        this.objects.push(newObject);
        this.updateCenterButtonVisibility();
        this.selectObject(newObject);
        this.render();
    }
    
    addSquare() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        const newObject = {
            id: Date.now(),
            type: 'square',
            x: centerX - this.offsetX - 50,
            y: centerY - this.offsetY - 50,
            width: 100,
            height: 100,
            fillColor: '#667eea',
            strokeColor: '#fff',
            strokeWidth: 2
        };
        
        this.objects.push(newObject);
        this.updateCenterButtonVisibility();
        this.selectObject(newObject);
        this.render();
    }
    
    getLineEndpointAtPoint(x, y) {
        const hitDistance = 10;
        let closest = null;
        let closestDist = hitDistance;
        
        for (const obj of this.objects) {
            if (obj.type !== 'line') continue;
            
            const screenX1 = obj.x + this.offsetX;
            const screenY1 = obj.y + this.offsetY;
            const screenX2 = obj.x2 + this.offsetX;
            const screenY2 = obj.y2 + this.offsetY;
            
            const dist1 = Math.sqrt((x - screenX1) ** 2 + (y - screenY1) ** 2);
            const dist2 = Math.sqrt((x - screenX2) ** 2 + (y - screenY2) ** 2);
            
            if (dist1 < closestDist) {
                closestDist = dist1;
                closest = { obj, endpoint: 'start' };
            }
            if (dist2 < closestDist) {
                closestDist = dist2;
                closest = { obj, endpoint: 'end' };
            }
        }
        return closest;
    }
    
    getSquareCornerAtPoint(x, y) {
        const hitDistance = 10;
        
        for (const obj of this.objects) {
            if (obj.type !== 'square') continue;
            
            const screenX = obj.x + this.offsetX;
            const screenY = obj.y + this.offsetY;
            const screenX2 = screenX + obj.width;
            const screenY2 = screenY + obj.height;
            
            const dist = Math.sqrt((x - screenX2) ** 2 + (y - screenY2) ** 2);
            if (dist < hitDistance) {
                return obj;
            }
        }
        return null;
    }

    getLineAtPoint(x, y) {
        const hitDistance = 8;
        
        for (const obj of this.objects) {
            if (obj.type !== 'line') continue;
            
            const screenX1 = obj.x + this.offsetX;
            const screenY1 = obj.y + this.offsetY;
            const screenX2 = obj.x2 + this.offsetX;
            const screenY2 = obj.y2 + this.offsetY;
            
            // Don't select if clicking on an endpoint
            const endpointHitDistance = 10;
            const dist1 = Math.sqrt((x - screenX1) ** 2 + (y - screenY1) ** 2);
            const dist2 = Math.sqrt((x - screenX2) ** 2 + (y - screenY2) ** 2);
            if (dist1 < endpointHitDistance || dist2 < endpointHitDistance) {
                continue;
            }
            
            const dist = this.distanceToLine(x, y, screenX1, screenY1, screenX2, screenY2);
            if (dist < hitDistance) {
                return obj;
            }
        }
        return null;
    }
    
    updateHoveredObject() {
        this.hoveredObject = null;
        
        for (const obj of this.objects) {
            const screenX = obj.x + this.offsetX;
            const screenY = obj.y + this.offsetY;
            
            let isNear = false;
            
            if (obj.type === 'grave') {
                const distance = Math.sqrt((this.mouseX - screenX) ** 2 + (this.mouseY - screenY) ** 2);
                isNear = distance < this.hoverDistance;
            } else if (obj.type === 'text') {
                this.ctx.font = `${obj.fontSize}px Arial`;
                const lines = obj.content.split('\n');
                const lineHeight = obj.fontSize * 1.2;
                let maxWidth = 0;
                for (const line of lines) {
                    const lineMetrics = this.ctx.measureText(line);
                    maxWidth = Math.max(maxWidth, lineMetrics.width);
                }
                const totalHeight = lines.length * lineHeight;
                const padding = 10;
                isNear = this.mouseX >= screenX - padding && this.mouseX <= screenX + maxWidth + padding && 
                         this.mouseY >= screenY - padding && this.mouseY <= screenY + totalHeight + padding;
            } else if (obj.type === 'line') {
                const dist = this.distanceToLine(this.mouseX, this.mouseY, screenX, screenY, obj.x2 + this.offsetX, obj.y2 + this.offsetY);
                isNear = dist < 10;
            } else if (obj.type === 'square') {
                const screenX2 = screenX + obj.width;
                const screenY2 = screenY + obj.height;
                isNear = this.mouseX >= screenX && this.mouseX <= screenX2 && this.mouseY >= screenY && this.mouseY <= screenY2;
            }
            
            if (isNear) {
                this.hoveredObject = obj;
                break;
            }
        }
        
        // Update cursor based on state
        if (this.resizingLineEnd || this.resizingSquareCorner) {
            this.canvas.style.cursor = 'grabbing';
        } else if (this.draggingObject) {
            this.canvas.style.cursor = 'grabbing';
        } else if (this.isDragging) {
            this.canvas.style.cursor = 'grabbing';
        } else if (this.spacePressed) {
            this.canvas.style.cursor = 'grab';
        } else if (this.hoveredObject) {
            if (this.hoveredObject.type === 'line' || this.hoveredObject.type === 'square') {
                this.canvas.style.cursor = 'move';
            } else {
                this.canvas.style.cursor = 'pointer';
            }
        } else {
            this.canvas.style.cursor = 'auto';
        }
    }
    
    distanceToLine(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
        const closestX = x1 + t * dx;
        const closestY = y1 + t * dy;
        return Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);
    }
    
    getObjectAtPoint(x, y) {
        for (const obj of this.objects) {
            const screenX = obj.x + this.offsetX;
            const screenY = obj.y + this.offsetY;
            
            if (obj.type === 'grave') {
                const distance = Math.sqrt((x - screenX) ** 2 + (y - screenY) ** 2);
                if (distance < obj.size) return obj;
            } else if (obj.type === 'text') {
                this.ctx.font = `${obj.fontSize}px Arial`;
                const lines = obj.content.split('\n');
                const lineHeight = obj.fontSize * 1.2;
                let maxWidth = 0;
                for (const line of lines) {
                    const lineMetrics = this.ctx.measureText(line);
                    maxWidth = Math.max(maxWidth, lineMetrics.width);
                }
                const totalHeight = lines.length * lineHeight;
                const padding = 5;
                if (x >= screenX - padding && x <= screenX + maxWidth + padding && 
                    y >= screenY - padding && y <= screenY + totalHeight + padding) {
                    return obj;
                }
            } else if (obj.type === 'square') {
                if (x >= screenX && x <= screenX + obj.width && y >= screenY && y <= screenY + obj.height) {
                    return obj;
                }
            }
        }
        return null;
    }
    
    selectObject(obj) {
        this.selectedObject = obj;
        this.openSidebar();
        this.updateSidebarContent();
    }
    
    deleteSelectedObject() {
        if (this.selectedObject) {
            this.objects = this.objects.filter(obj => obj.id !== this.selectedObject.id);
            this.closeSidebar();
            this.selectedObject = null;
            this.updateCenterButtonVisibility();
            this.render();
        }
    }
    
    isObjectVisible(obj) {
        const screenX = obj.x + this.offsetX;
        const screenY = obj.y + this.offsetY;
        const padding = 100;
        
        return screenX > -padding && screenX < this.canvas.width + padding &&
               screenY > -padding && screenY < this.canvas.height + padding;
    }
    
    updateCenterButtonVisibility() {
        if (this.objects.length === 0) {
            this.centerButton.classList.remove('visible');
            return;
        }
        
        const hasVisibleObjects = this.objects.some(obj => this.isObjectVisible(obj));
        
        if (hasVisibleObjects) {
            this.centerButton.classList.remove('visible');
        } else {
            this.centerButton.classList.add('visible');
        }
    }
    
    centerViewOnObjects() {
        if (this.objects.length === 0) return;
        
        // Center on the first object
        const firstObj = this.objects[0];
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        this.offsetX = centerX - firstObj.x;
        this.offsetY = centerY - firstObj.y;
        
        this.updateCenterButtonVisibility();
        this.render();
    }
    
    openSidebar() {
        this.sidebar.classList.add('open');
    }
    
    closeSidebar() {
        this.sidebar.classList.remove('open');
        this.selectedObject = null;
    }
    
    shareGraveyard() {
        const data = JSON.stringify(this.objects);
        const encoded = btoa(encodeURIComponent(data));
        const url = `${window.location.origin}${window.location.pathname}#data=${encoded}`;
        
        // Copy to clipboard
        navigator.clipboard.writeText(url).then(() => {
            alert('Graveyard link copied to clipboard!');
        }).catch(() => {
            // Fallback: show URL in alert
            alert('Share this link:\n\n' + url);
        });
    }
    
    loadFromURL() {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const encodedData = params.get('data');
        
        if (encodedData) {
            try {
                const data = JSON.parse(decodeURIComponent(atob(encodedData)));
                this.objects = data;
                this.centerViewOnObjects();
            } catch (e) {
                console.error('Failed to load graveyard data:', e);
            }
        }
    }
    
    updateSidebarContent() {
        if (!this.selectedObject) return;
        
        // Hide all sections
        document.getElementById('graveSection').style.display = 'none';
        document.getElementById('textSection').style.display = 'none';
        document.getElementById('lineSection').style.display = 'none';
        document.getElementById('squareSection').style.display = 'none';
        
        if (this.selectedObject.type === 'grave') {
            document.getElementById('graveSection').style.display = 'block';
            document.getElementById('sidebarTitle').textContent = this.selectedObject.name;
            document.getElementById('graveName').value = this.selectedObject.name;
            document.getElementById('graveDescription').value = this.selectedObject.description;
            document.getElementById('graveEmoji').value = this.selectedObject.emoji;
        } else if (this.selectedObject.type === 'text') {
            document.getElementById('textSection').style.display = 'block';
            document.getElementById('sidebarTitle').textContent = 'Text Object';
            document.getElementById('textContent').value = this.selectedObject.content;
            document.getElementById('textSize').value = this.selectedObject.fontSize;
        } else if (this.selectedObject.type === 'line') {
            document.getElementById('lineSection').style.display = 'block';
            document.getElementById('sidebarTitle').textContent = 'Line Object';
        } else if (this.selectedObject.type === 'square') {
            document.getElementById('squareSection').style.display = 'block';
            document.getElementById('sidebarTitle').textContent = 'Square Object';
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid pattern
        this.drawGrid();
        
        // Draw objects
        for (const obj of this.objects) {
            this.drawObject(obj);
        }
    }
    
    drawGrid() {
        const gridSize = 40;
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        
        // Use modulus to create seamless grid
        const offsetXMod = ((this.offsetX % gridSize) + gridSize) % gridSize;
        const offsetYMod = ((this.offsetY % gridSize) + gridSize) % gridSize;
        
        // Draw vertical lines
        for (let x = offsetXMod; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = offsetYMod; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    drawObject(obj) {
        if (obj.type === 'grave') {
            this.drawGrave(obj);
        } else if (obj.type === 'text') {
            this.drawText(obj);
        } else if (obj.type === 'line') {
            this.drawLine(obj);
        } else if (obj.type === 'square') {
            this.drawSquare(obj);
        }
    }
    
    drawGrave(obj) {
        const screenX = obj.x + this.offsetX;
        const screenY = obj.y + this.offsetY;
        
        const isHovered = this.hoveredObject?.id === obj.id;
        const isSelected = this.selectedObject?.id === obj.id;
        
        // Draw background circle
        this.ctx.fillStyle = isSelected ? '#667eea' : isHovered ? '#764ba2' : '#444';
        this.ctx.beginPath();
        this.ctx.arc(screenX, screenY - 5, obj.size, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw border
        this.ctx.strokeStyle = isSelected ? '#fff' : '#667eea';
        this.ctx.lineWidth = isSelected ? 3 : 2;
        this.ctx.stroke();
        
        // Draw emoji
        this.ctx.font = `${obj.size}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(obj.emoji, screenX, screenY);
        
        // Draw text
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(obj.name, screenX, screenY + obj.size + 15);
    }
    
    drawText(obj) {
        const screenX = obj.x + this.offsetX;
        const screenY = obj.y + this.offsetY;
        const isHovered = this.hoveredObject?.id === obj.id;
        
        this.ctx.font = `${obj.fontSize}px Arial`;
        this.ctx.fillStyle = isHovered ? '#667eea' : obj.color;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        
        // Split content by newlines and draw each line
        const lines = obj.content.split('\n');
        const lineHeight = obj.fontSize * 1.2;
        
        for (let i = 0; i < lines.length; i++) {
            this.ctx.fillText(lines[i], screenX, screenY + (i * lineHeight));
        }
        
        // Draw selection box when selected
        if (this.selectedObject?.id === obj.id) {
            const metrics = this.ctx.measureText(obj.content);
            let maxWidth = 0;
            for (const line of lines) {
                const lineMetrics = this.ctx.measureText(line);
                maxWidth = Math.max(maxWidth, lineMetrics.width);
            }
            const totalHeight = lines.length * lineHeight;
            this.ctx.strokeStyle = '#667eea';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(screenX - 2, screenY - 2, maxWidth + 4, totalHeight + 4);
        }
    }
    
    drawLine(obj) {
        const screenX1 = obj.x + this.offsetX;
        const screenY1 = obj.y + this.offsetY;
        const screenX2 = obj.x2 + this.offsetX;
        const screenY2 = obj.y2 + this.offsetY;
        const isHovered = this.hoveredObject?.id === obj.id;
        
        // Draw line
        this.ctx.strokeStyle = isHovered ? '#667eea' : obj.color;
        this.ctx.lineWidth = obj.width;
        this.ctx.beginPath();
        this.ctx.moveTo(screenX1, screenY1);
        this.ctx.lineTo(screenX2, screenY2);
        this.ctx.stroke();
        
        // Draw endpoints if selected
        if (this.selectedObject?.id === obj.id || isHovered) {
            this.ctx.fillStyle = '#667eea';
            this.ctx.beginPath();
            this.ctx.arc(screenX1, screenY1, 5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(screenX2, screenY2, 5, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawSquare(obj) {
        const screenX = obj.x + this.offsetX;
        const screenY = obj.y + this.offsetY;
        const isHovered = this.hoveredObject?.id === obj.id;
        
        // Draw fill
        this.ctx.fillStyle = isHovered ? '#667eea' : obj.fillColor;
        this.ctx.fillRect(screenX, screenY, obj.width, obj.height);
        
        // Draw border
        this.ctx.strokeStyle = obj.strokeColor;
        this.ctx.lineWidth = obj.strokeWidth;
        this.ctx.strokeRect(screenX, screenY, obj.width, obj.height);
        
        // Draw resize handle if selected
        if (this.selectedObject?.id === obj.id || isHovered) {
            this.ctx.fillStyle = '#667eea';
            const handleSize = 8;
            this.ctx.fillRect(screenX + obj.width - handleSize, screenY + obj.height - handleSize, handleSize, handleSize);
        }
    }
    
    animate() {
        this.render();
        this.updateCenterButtonVisibility();
        requestAnimationFrame(() => this.animate());
    }

    snapToGrid(value) {
        const gridSize = 40;
        return Math.round(value / gridSize) * gridSize;
    }

    screenToWorld(x, y) {
        return {
            x: x - this.offsetX,
            y: y - this.offsetY
        };
    }

    worldToScreen(x, y) {
        return {
            x: x + this.offsetX,
            y: y + this.offsetY
        };
    }

}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    new ProjectGraveyard();
});
