class ProjectGraveyard {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.plusButton = document.getElementById('plusButton');
        this.centerButton = document.getElementById('centerButton');
        this.shareButton = document.getElementById('shareButton');
        this.sidebar = document.getElementById('sidebar');
        this.closeButton = document.getElementById('closeButton');
        this.deleteButton = document.getElementById('deleteButton');
        
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
        
        // Mouse position
        this.mouseX = 0;
        this.mouseY = 0;
        
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
        
        // Sidebar
        this.closeButton.addEventListener('click', () => this.closeSidebar());
        this.deleteButton.addEventListener('click', () => this.deleteSelectedObject());
        
        // Form inputs
        document.getElementById('projectName').addEventListener('input', (e) => {
            if (this.selectedObject) {
                this.selectedObject.name = e.target.value;
                this.render();
            }
        });
        
        document.getElementById('projectDescription').addEventListener('input', (e) => {
            if (this.selectedObject) {
                this.selectedObject.description = e.target.value;
            }
        });
        
        document.getElementById('projectEmoji').addEventListener('input', (e) => {
            if (this.selectedObject) {
                this.selectedObject.emoji = e.target.value || '🪦';
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
            e.preventDefault();
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
            
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
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
        
        // Left click on object
        if (e.button === 0 && !this.spacePressed) {
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
        if (this.isDragging) {
            this.isDragging = false;
            this.canvas.classList.remove('canvas-dragging');
        }
        if (this.draggingObject) {
            this.draggingObject = null;
            this.canvas.classList.remove('object-dragging');
        }
    }
    
    handleWheel(e) {
        e.preventDefault();
        // Optional: Add zoom functionality
    }
    
    addObject() {
        // Spawn in center of screen
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        const newObject = {
            id: Date.now(),
            name: `Project ${this.objects.length + 1}`,
            description: '',
            x: centerX - this.offsetX,
            y: centerY - this.offsetY,
            emoji: '🪦',
            size: 60
        };
        
        this.objects.push(newObject);
        this.updateCenterButtonVisibility();
        this.render();
    }
    
    updateHoveredObject() {
        this.hoveredObject = null;
        
        for (const obj of this.objects) {
            const screenX = obj.x + this.offsetX;
            const screenY = obj.y + this.offsetY;
            
            const distance = Math.sqrt(
                (this.mouseX - screenX) ** 2 + 
                (this.mouseY - screenY) ** 2
            );
            
            if (distance < this.hoverDistance) {
                this.hoveredObject = obj;
                break;
            }
        }
        
        // Update cursor based on state
        if (this.draggingObject) {
            this.canvas.style.cursor = 'grabbing';
        } else if (this.isDragging) {
            this.canvas.style.cursor = 'grabbing';
        } else if (this.spacePressed) {
            this.canvas.style.cursor = 'grab';
        } else if (this.hoveredObject) {
            this.canvas.style.cursor = 'pointer';
        } else {
            this.canvas.style.cursor = 'auto';
        }
    }
    
    getObjectAtPoint(x, y) {
        for (const obj of this.objects) {
            const screenX = obj.x + this.offsetX;
            const screenY = obj.y + this.offsetY;
            
            const distance = Math.sqrt((x - screenX) ** 2 + (y - screenY) ** 2);
            
            if (distance < obj.size) {
                return obj;
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
        if (this.selectedObject) {
            document.getElementById('sidebarTitle').textContent = this.selectedObject.name;
            document.getElementById('projectName').value = this.selectedObject.name;
            document.getElementById('projectDescription').value = this.selectedObject.description;
            document.getElementById('projectEmoji').value = this.selectedObject.emoji;
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
    
    animate() {
        this.render();
        this.updateCenterButtonVisibility();
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    new ProjectGraveyard();
});
