const express = require('express')
const router = express.Router()
const fs = require('fs')
const fse = require('fs-extra')
const path = require('path')
const serverUpdatePath = path.join(__dirname, '../public/download/latest/ebook3.0-win32-x64/update.json')
const config = require(path.join(__dirname, '../config'))

const serverUrl = config.serverUrl


/* GET home page. */
router.get('/', function (req, res, next) {
	res.render('index', {
		title: 'Express'
	});
});


//检查更新
router.post('/checkUpdate', function (req, res, next) {
	let info = {
		flag: false,
		message: "",
		data: null
	}
	//本地update.json里的版本号
	let localVersion = req.body.version
	//读取服务器端update.json的version
	fse.readJson(serverUpdatePath, (err, packageObj) => {
		if (!err) {
			let serverVersion = packageObj.version
			let updateDescription = packageObj.description
			let updateTime = packageObj.update_time

			if (localVersion === serverVersion) {
				info.message = "没有更新"
				info.flag = true
				res.send(info)
			} else {
				info.message = "有新的更新内容"
				info.flag = true
				info.data = {
					description: updateDescription,
					time: updateTime
				}
				res.send(info)
			}
		} else {
			info.message = "检查更新发生错误"
			info.flag = true
			res.send(info)
		}
	})
});

router.post('/update', function (req, res, next) {
	let info = {
		flag: false,
		message: "",
		data: null
	}
	let localData = req.body
	let localMd5Obj = localData.md5Obj

	let downloadUrl = serverUrl + '/download/latest/ebook3.0-win32-x64'
	fse.readJson(serverUpdatePath, (err, packageObj) => {
		if (!err) {
			let serverMd5Obj = packageObj.md5Obj
			//比较两个md5
			let operate = {}
			for (let i in localMd5Obj) {
				if (!serverMd5Obj.hasOwnProperty(i)) {
					//服务器没有本地的数据，即本地有多余文件该删除
					let operateObj = {
						'filePath': i,
						'url': downloadUrl + i,
						'oper': 'delete'
					}
					operate[i] = operateObj
				}
				for (let k in serverMd5Obj) {
					if (k === i) {
						if (serverMd5Obj[k] === localMd5Obj[i]) {
							let operateObj = {
								'filePath': i,
								'url': downloadUrl + i,
								'oper': 'default'
							}
							operate[i] = operateObj
							break
						} else {
							let operateObj = {
								'filePath': i,
								'url': downloadUrl + i,
								'oper': 'update'
							}
							operate[i] = operateObj
							break
						}
					}
				}
			}
			for (let j in serverMd5Obj) {
				if (!localMd5Obj.hasOwnProperty(j)) {
					let operateObj = {
						'filePath': j,
						'url': downloadUrl + j,
						'oper': 'add'
					}
					operate[j] = operateObj
				}
			}

			info.data = operate
			console.log(Object.getOwnPropertyNames(operate).length);
			info.flag = true
			info.message = "请求成功"
			console.log(info.data)
			res.send(info)
		} else {
			info.message = "检查更新发生错误"
			res.send(info)
		}
	})


})






module.exports = router;