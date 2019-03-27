cc.Class({
    extends: cc.Component,

    properties: {
        backGround: {
            default: null,
            type: cc.Sprite,
        },
        tiledMap: {
            default: null,
            type: cc.TiledMap,
        },
        player: {
            default: null,
            type: cc.Sprite,
        },
        playerTile: {
            default: new cc.Vec2(),
            tooltip: "角色初始位置（tile坐标)",
        },
        atlas: {
            default: null,
            type: cc.SpriteAtlas,
        },
        deltaY: {
            default: 16,
            tooltip: "角色站立点比图块底端高的值",
        },
        speed: 3,
        timeForOneFrame: 0.033,
        playerIsMoving: {
            default: true,
            tooltip: "是否在一开始让角色向初始位置移动",
        },
    },


    onLoad() {
        // 初始化变量
        this.direction = "";
        this.timeMoving = 0;
        this.keyUpPressed = false;
        this.keyDownPressed = false;
        this.keyLeftPressed = false;
        this.keyRightPressed = false;
        this.player.spriteFrame = this.atlas.getSpriteFrame('run_1');
        this.nodeMainCamera = this.node.getChildByName('Main Camera');
        this.visibleSize = cc.view.getVisibleSize();
        this.canvasSize = this.node.getComponent(cc.Canvas).designResolution;

        console.log("cc.view = ", this.visibleSize, "canvasSize = ", this.canvasSize);

        // 初始化相机位置
        this.nodeMainCamera.setPosition(this.player.node.getPosition());

        // 注册全局系统事件
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);

        // 注册结点系统事件
        this.backGround.node.on(cc.Node.EventType.TOUCH_START, this.onMouseDown, this);
        this.backGround.node.on(cc.Node.EventType.TOUCH_END, this.onMouseDown, this);
        this.backGround.node.on(cc.Node.EventType.TOUCH_MOVE, this.onMouseDown, this);
    },


    onMouseDown(event) {
        console.log("--------onMouseDown-------");

        let posMouse = event.getLocation(), //经测试为this.visibleSize内一点，原点位于左下
            //canvasSize = this.canvasSize,
            visibleSize = this.visibleSize,
            posCamera = this.nodeMainCamera.getPosition();
        console.log("posMouse = ", posMouse, "nodeMainCamera = ", posCamera);

        // 换算鼠标坐标到canvas坐标系
        posMouse = cc.v2(posMouse.x - visibleSize.width / 2.0 + posCamera.x, posMouse.y - visibleSize.height / 2.0 + this.nodeMainCamera.y);
        console.log("after transformation, posMouse = ", posMouse);

        // 获取player在canvas下的坐标
        let pos = this.tiledMap.getLayer('layer1').getPositionAt(this.playerTile); pos.y += this.deltaY;
        console.log("player's pos should be pos = ", pos);

        // 获取鼠标坐标相对player坐标的向量(dx,dy）
        let dx = posMouse.x - pos.x, dy = posMouse.y - pos.y;

        // 将(dx,dy)换算到tiledMap的坐标系中，换算过程已拍照
        let tileSize = this.tiledMap.getTileSize(), w = tileSize.width, h = tileSize.height,
            dxTile = dx / w - dy / h, dyTile = -dx / w - dy / h;

        // 在playerTile上增加位移向量，得到newTile
        let newTile = cc.v2(Math.ceil(this.playerTile.x + dxTile), Math.ceil(this.playerTile.y + dyTile));
        console.log("newTile = ", newTile);

        // 开始移动（todo:通行判断、寻路算法）
        this.playerTile = newTile;
        this.playerIsMoving = true;
    },


    onKeyDown(event) {
        var direction_;
        switch (event.keyCode) {
            case cc.macro.KEY.up:
                this.keyUpPressed = true; direction_ = "up";
                if (this.keyLeftPressed) direction_ += "Left";
                else if (this.keyRightPressed) direction_ += "Right";
                break;
            case cc.macro.KEY.down:
                this.keyDownPressed = true; direction_ = "down";
                if (this.keyLeftPressed) direction_ += "Left";
                else if (this.keyRightPressed) direction_ += "Right";
                break;
            case cc.macro.KEY.left:
                this.keyLeftPressed = true; direction_ = "left";
                if (this.keyUpPressed) direction_ = direction_ + "Up";
                else if (this.keyDownPressed) direction_ += "Down";
                break;
            case cc.macro.KEY.right:
                this.keyRightPressed = true; direction_ = "right";
                if (this.keyUpPressed) direction_ += "Up";
                else if (this.keyDownPressed) direction_ += "Down";
                break;
            default:
                return;
        }
        this.direction = direction_;
        this.tryMoveByDirection();
    },

    onKeyUp: function (event) {
        this.direction = "";
        switch (event.keyCode) {
            case cc.macro.KEY.up:
                this.keyUpPressed = false;
                break;
            case cc.macro.KEY.down:
                this.keyDownPressed = false;
                break;
            case cc.macro.KEY.left:
                this.keyLeftPressed = false;
                break;
            case cc.macro.KEY.right:
                this.keyRightPressed = false;
                break;
            default:
                return;
        }
        /*
        if(this.keyUpPressed)
            this.direction = "up";
        if(this.keyDownPressed)
            this.direction = "down";
        if(this.keyLeftPressed)
            this.direction = "left";
        if(this.keyRightPressed)
            this.direction = "right";
        this.tryMoveByDirection();
        */
    },


    // 尝试移动player朝某个方向
    tryMoveByDirection: function () {
        if (this.playerIsMoving)
            return;

        var newTile = cc.v2(this.playerTile.x, this.playerTile.y);
        switch (this.direction) {
            case "up":
                newTile.y -= 1; newTile.x -= 1; break;
            case "down":
                newTile.y += 1; newTile.x += 1; break;
            case "left":
                newTile.x -= 1; newTile.y += 1; break;
            case "right":
                newTile.x += 1; newTile.y -= 1; break;
            case "upLeft": case "leftUp":
                newTile.x -= 1; break;
            case "upRight": case "rightUp":
                newTile.y -= 1; break;
            case "downLeft": case "leftDown":
                newTile.y += 1; break;
            case "downRight": case "rightDown":
                newTile.x += 1; break;
            default:
                return;
        }
        console.log("newTile = ", newTile, "（Tile坐标）");

        // 判断newTile是否超出tileMap的范围
        var tilePos = this.getTilePosByTile(newTile);
        var mapSize = this.tiledMap.getMapSize();
        if (tilePos.x < 0 || tilePos.x >= mapSize.width) return;
        if (tilePos.y < 0 || tilePos.y >= mapSize.height) return;

        // 判断newTile对应的图块是否可通行
        var gid = this.tiledMap.getLayer('layer1').getTileGIDAt(tilePos);
        console.log("newTile GID = ", gid);
        //if(gid >= 8 || gid == 5) //【表示图块无法通行】手动设置该条件
        //    return;

        // 准备移动角色
        this.playerTile = newTile;
        this.playerIsMoving = true;
    },

    // 转换为能用于layer.getTileXXX的Tile坐标
    getTilePosByTile: function (tile) {
        return cc.v2(tile.x, tile.y + 1); //【当tilemap的anchor为(0,0)时测试无误】
    },

    /*
    // 将pixel坐标转换为Tile坐标
    getTilePosByPixelPos: function(posInPixel) {
        var mapSize = this.tileMap.node.getContentSize();
        var tileSize = this.tiledMap.getTileSize();
        var x = Math.floor(posInPixel.x / tileSize.width);
        var y = Math.floor((mapSize.height - posInPixel.y) / tileSize.height);
        return cc.v2(x, y);
    },
    */


    // 改变player的贴图
    changeSpriteFrame: function (param) {
        if (typeof (param) === "string")
            this.player.spriteFrame = this.atlas.getSpriteFrame(param);
        else if (param === undefined) {
            var str = this.player.spriteFrame.name;
            switch (str) {
                case "run_1":
                    str = "run_2";
                    break;
                case "run_2":
                    str = "run_0";
                    break;
                case "run_0":
                    str = "run_1";
                    break;
                default:
                    str = "run_1";
            }
            this.player.spriteFrame = this.atlas.getSpriteFrame(str);
        }
    },


    start() {

    },


    update: function (dt) {
        // 移动player
        if (this.playerIsMoving) {
            // 计算距离（单位：像素）
            var pos = this.tiledMap.getLayer('layer1').getPositionAt(this.playerTile); //获取playerTile（Tile坐标）的像素坐标
            pos.y += this.deltaY;
            //console.log("update...playerTile = ",this.playerTile,"（Tile坐标）");
            var posPlayer = this.player.node.getPosition();
            var dx = pos.x - posPlayer.x, dy = pos.y - posPlayer.y;
            var distance = Math.sqrt(dx * dx + dy * dy);

            var distance_dt = this.speed * dt * 100;
            if (distance <= distance_dt) {
                // 到达playerTile指定的位置pos
                this.player.node.setPosition(pos.x, pos.y);
                //// 设置player的spriteFrame
                //this.changeSpriteFrame("run_1");
                // 关闭移动
                this.playerIsMoving = false;
            }
            else {
                // 移动，距离为distance_dt
                var p = distance_dt / distance; this.player.node.x += p * dx; this.player.node.y += p * dy;
                // 计时器增加
                this.timeMoving += dt;
                if (this.timeMoving > this.timeForOneFrame) {
                    // 设置player的spriteFrame
                    this.changeSpriteFrame();
                    // 清零计时器
                    this.timeMoving = 0;
                }

            }
            // 移动相机
            posPlayer = this.player.node.getPosition(); this.nodeMainCamera.setPosition(posPlayer);
        }
    },
});
