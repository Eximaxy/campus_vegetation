# 校园绿植养护 WebGIS 管理系统

这是一个面向校园绿化巡查与养护管理的 WebGIS 课程作业系统。系统以校园地图为核心，围绕绿植档案、问题上报、养护打卡、审核流程和统计看板组织业务功能。

## 功能概览

- 登录/注册与管理员权限控制
- 校园绿植地图、点位筛选、坐标显示、热力图叠加
- 绿植档案列表与详情、收藏、校园植物图鉴
- 养护打卡：浇水、修剪、施肥、巡查、病虫害处理
- 问题上报：枯萎、缺水、虫害、倒伏、设施损坏等
- 管理后台：绿植 CRUD、养护审核、问题审核、用户管理
- 数据看板：核心指标、趋势图、类型统计、健康状态统计、排行榜
- localStorage 演示存储，附 PostgreSQL + PostGIS 迁移脚本

## 快速启动

```powershell
cd campus-plant-gis
pip install -r backend/requirements.txt
python backend/app.py
```

浏览器访问：

```text
http://127.0.0.1:5000
```

演示账号：

- 管理员：admin / admin123
- 普通用户：student / 123456

## 目录结构

```text
campus-plant-gis/
  backend/              Flask 启动入口与预留 API
  database/             PostgreSQL + PostGIS 数据库脚本
  docs/                 技术说明材料
  frontend/             前端页面、样式与业务脚本
```

## 说明

当前版本为课程演示版，所有业务数据保存在浏览器 localStorage 中。若需要恢复初始数据，可在浏览器控制台执行：

```javascript
localStorage.clear();
location.reload();
```
