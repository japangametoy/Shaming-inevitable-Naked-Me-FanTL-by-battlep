//=============================================================================
// UTA_UnderpossCeiling.js
//=============================================================================
/*:
 * @plugindesc Allow to be passable under the tile with the specified region ID.
 * @author T.Akatsuki
 * 
 * @param Underpass Region ID
 * @desc Definition of region ID to be given to a tiled map to be passable through.
 * @default 252
 * 
 * @param Not Passable Region ID
 * @desc Definition of the region ID to be prohibited.
 * @default 253
 * 
 * @help # Overview
 * UTA_UnderpassCeiling plugin make possible to pass under the tile map with 
 * the specified region id set.
 * This plugin is useful when you want to create hidden passages.
 * 
 * Please set the region ID(Underpass Region ID) on the ceiling tile 
 * you want to make a hidden passage.
 * There is a problem that you can move freely on the ceiling tile 
 * if you allow it to passable roof tile.
 * In order to solve this problem, 
 * please set region id (Not Passable Region ID) just like pinching 
 * the way passable tile.
 * 
 * Tiles with "Not Passable Region ID" set not only to not be passable, 
 * but also be drawn on front of character graphics.
 * 
 * This plugin support on both Local version and Web version.
 * 
 * # Plugin Commands
 * This plugin does not provide plugin commands.
 * 
 * # Plugin Info
 * Version     : 1.0.0
 * Last Update : August 25th, 2018
 * Author      : T.Akatsuki
 * Web Page    : https://www.utakata-no-yume.net
 * License     : MIT License
 * (https://www.utakata-no-yume.net/gallery/rpgmv/plugin/license.html)
 * 
 * # Change Log
 * ver 1.0.0 (August 25th, 2018)
 *   First release.
 */
/*:ja
 * @plugindesc 特定のリージョンIDを指定したタイルの下をくぐり抜けられるようにするプラグインです。
 * @author 赤月 智平
 * 
 * @param Underpass Region ID
 * @desc くぐり抜けられるタイルマップに付与するリージョンIDの定義。
 * @default 252
 * 
 * @param Not Passable Region ID
 * @desc 通行禁止にするリージョンIDの定義。
 * @default 253
 * 
 * @help ■プラグインの概要
 * 指定したリージョンIDを設定したタイルマップの下をくぐり抜けられるようにします。
 * 隠し通路などを作成したい場合に特に有効です。
 * 
 * 天井タイルをくぐり抜けられるようにすると、
 * 天井タイルを自由に移動できる状態になってしまうので、
 * くぐり抜けられるようにした道を挟むように
 * 通行不可リージョン(Not Passable Region IDで設定したリージョンID)を
 * 設定してください。
 * 
 * Not Passable Region IDを設定したタイルは通行不可になるだけでなく、
 * タイル設定で「☆」に設定したタイルのように
 * キャラクターの前面に描画されるようになります。
 * height大きめのキャラクターがはみ出してしまう場合の調整にも利用してください。
 * 
 * Local版、Web版どちらにも対応しています。
 * 
 * ■プラグインコマンド
 * プラグインコマンドはありません。
 * 
 * ■プラグインの情報
 * バージョン : 1.0.0
 * 最終更新日 : 2018.08.25
 * 制作者     : 赤月 智平
 * Webサイト  : https://www.utakata-no-yume.net
 * ライセンス : MIT License
 * (https://www.utakata-no-yume.net/gallery/rpgmv/plugin/license.html)
 * 
 * ■更新履歴
 * ver 1.0.0 (2018.08.25)
 *   初版。
 */
//=============================================================================

var utakata = utakata || {};
(function(utakata){
    "use strict";
    utakata.UnderpassCeiling = (function(){
        var __VERSION__     = "1.0.0";
        var __PLUGIN_NAME__ = "UTA_UnderpassCeiling";

        UnderpassCeiling._parameters = {
            "Underpass Region ID"   : null,
            "Not Passable Region ID": null
        };

        function UnderpassCeiling(){
            throw new Error("utakata.UnderpassCeiling is static class.");
        }

        UnderpassCeiling._initialize = function(){
            this._loadPluginParameters();
        };

        UnderpassCeiling._loadPluginParameters = function(){
            var _pluginParameters = PluginManager.parameters(this.getPluginName());
            try{
                this._parameters["Underpass Region ID"] = Number(_pluginParameters["Underpass Region ID"] || 252);
                this._parameters["Not Passable Region ID"] = Number(_pluginParameters["Not Passable Region ID"] || 253);
            }catch(e){
                console.error("utakata.UnderpassCeiling, _loadPluginParameters: invalid plugin parameters.", e.message, e.stack);
                throw e;
            }
        };

        UnderpassCeiling.isUnderpassRegionId = function(id){
            return id === this._parameters["Underpass Region ID"];
        };

        UnderpassCeiling.isNotPassableRegionId = function(id){
            return id === this._parameters["Not Passable Region ID"];
        };

        UnderpassCeiling.getPluginName = function(){ return __PLUGIN_NAME__; };
        UnderpassCeiling.getPluginVersion = function(){ return __VERSION__; };

        return UnderpassCeiling;
    })();
    utakata.UnderpassCeiling._initialize();

    //-------------------------------------------------------------------
    // TileMap
    //-------------------------------------------------------------------
    /**
     * 上書きしてしまうと他のプラグインとの競合を起こすので、
     * 条件に一致する場合のみを改変処理へ振り分ける
     * for canvas render mode
     * based on v 1.6.1
     */
    var _Tilemap_paintTiles = Tilemap.prototype._paintTiles;
    Tilemap.prototype._paintTiles = function(startX, startY, x, y){
        var regionId = $gameMap.regionId(startX + x, startY + y);

        // 条件に一致しない場合は通常レンダリング処理
        if(!utakata.UnderpassCeiling.isUnderpassRegionId(regionId) && !utakata.UnderpassCeiling.isNotPassableRegionId(regionId)){
            _Tilemap_paintTiles.call(this, startX, startY, x, y);
            return;
        }

        // 条件に一致する場合 == 設定したRegionIDのタイルの場合は上層レイヤーに配置
        var tableEdgeVirtualId = 10000;
        var mx = startX + x;
        var my = startY + y;
        var dx = (mx * this._tileWidth).mod(this._layerWidth);
        var dy = (my * this._tileHeight).mod(this._layerHeight);
        var lx = dx / this._tileWidth;
        var ly = dy / this._tileHeight;
        var tileId0 = this._readMapData(mx, my, 0);
        var tileId1 = this._readMapData(mx, my, 1);
        var tileId2 = this._readMapData(mx, my, 2);
        var tileId3 = this._readMapData(mx, my, 3);
        var shadowBits = this._readMapData(mx, my, 4);
        var upperTileId1 = this._readMapData(mx, my - 1, 1);
        var lowerTiles = [];
        var upperTiles = [];

        upperTiles.push(tileId0);
        upperTiles.push(tileId1);
        upperTiles.push(tileId2);
        upperTiles.push(tileId3);

        lowerTiles.push(-shadowBits);

        if (this._isTableTile(upperTileId1) && !this._isTableTile(tileId1)) {
            if (!Tilemap.isShadowingTile(tileId0)) {
                lowerTiles.push(tableEdgeVirtualId + upperTileId1);
            }
        }

        var lastLowerTiles = this._readLastTiles(0, lx, ly);
        if (!lowerTiles.equals(lastLowerTiles) ||
                (Tilemap.isTileA1(tileId0) && this._frameUpdated)) {
            this._lowerBitmap.clearRect(dx, dy, this._tileWidth, this._tileHeight);
            for (var i = 0; i < lowerTiles.length; i++) {
                var lowerTileId = lowerTiles[i];
                if (lowerTileId < 0) {
                    this._drawShadow(this._lowerBitmap, shadowBits, dx, dy);
                } else if (lowerTileId >= tableEdgeVirtualId) {
                    this._drawTableEdge(this._lowerBitmap, upperTileId1, dx, dy);
                } else {
                    this._drawTile(this._lowerBitmap, lowerTileId, dx, dy);
                }
            }
            this._writeLastTiles(0, lx, ly, lowerTiles);
        }

        var lastUpperTiles = this._readLastTiles(1, lx, ly);
        if (!upperTiles.equals(lastUpperTiles)) {
            this._upperBitmap.clearRect(dx, dy, this._tileWidth, this._tileHeight);
            for (var j = 0; j < upperTiles.length; j++) {
                this._drawTile(this._upperBitmap, upperTiles[j], dx, dy);
            }
            this._writeLastTiles(1, lx, ly, upperTiles);
        }
    };

    //-------------------------------------------------------------------
    // ShaderTileMap
    //-------------------------------------------------------------------
    /**
     * 上書きしてしまうと他のプラグインとの競合を起こすので、
     * 条件に一致する場合のみを改変処理へ振り分ける
     * for webgl render mode
     * based on v 1.6.1
     */
    var _ShaderTilemap_paintTiles = ShaderTilemap.prototype._paintTiles;
    ShaderTilemap.prototype._paintTiles = function(startX, startY, x, y){
        var regionId = $gameMap.regionId(startX + x, startY + y);

        // 条件に一致しない場合は通常レンダリング処理
        if(!utakata.UnderpassCeiling.isUnderpassRegionId(regionId) && !utakata.UnderpassCeiling.isNotPassableRegionId(regionId)){
            _ShaderTilemap_paintTiles.call(this, startX, startY, x, y);
            return;
        }

        // 条件に一致する場合 == 設定したRegionIDのタイルの場合は上層レイヤーに配置
        var mx = startX + x;
        var my = startY + y;
        var dx = x * this._tileWidth, dy = y * this._tileHeight;
        var tileId0 = this._readMapData(mx, my, 0);
        var tileId1 = this._readMapData(mx, my, 1);
        var tileId2 = this._readMapData(mx, my, 2);
        var tileId3 = this._readMapData(mx, my, 3);
        var shadowBits = this._readMapData(mx, my, 4);
        var upperTileId1 = this._readMapData(mx, my - 1, 1);
        var lowerLayer = this.lowerLayer.children[0];
        var upperLayer = this.upperLayer.children[0];

        this._drawTile(upperLayer, tileId0, dx, dy);
        this._drawTile(upperLayer, tileId1, dx, dy);
        this._drawTile(upperLayer, tileId2, dx, dy);
        this._drawTile(upperLayer, tileId3, dx, dy);

        this._drawShadow(lowerLayer, shadowBits, dx, dy);
        if (this._isTableTile(upperTileId1) && !this._isTableTile(tileId1)) {
            if (!Tilemap.isShadowingTile(tileId0)) {
                this._drawTableEdge(lowerLayer, upperTileId1, dx, dy);
            }
        }
    };

    // -------------------------------------------------------------------
    // Game_Map
    // -------------------------------------------------------------------
    var _Game_Map_isPassable = Game_Map.prototype.isPassable;
    Game_Map.prototype.isPassable = function(x, y, d){
        // 条件に一致するマップタイルの通行許可判定を追加
        var regionId = this.regionId(x, y);
        if(utakata.UnderpassCeiling.isUnderpassRegionId(regionId)){
            return true;
        }
        if(utakata.UnderpassCeiling.isNotPassableRegionId(regionId)){
            return false;
        }
        return _Game_Map_isPassable.call(this, x, y, d);
    };
})(utakata);
