const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./database');
const XLSX = require('xlsx');
const { exec } = require('child_process');
const { SerialPort, ReadlineParser } = require('serialport');

const app = express();
const server = http.createServer(app); // Create HTTP server
const io = new Server(server, {
	cors: {
		origin: "*", // Allow all origins (change for production)
		methods: ["GET", "POST"]
	}
});

const port = 3000;
const imagesDir = "E:/smartVIEW/output_of_model";
// const imagesDir = "/var/www/html/jspl-defect-detection/images/input";
const uploadsDir = path.join(__dirname, '../../qc_images');
const distDir = path.join(__dirname, '../vue', 'dist');
const calWidthDir = "C:/Users/Admin/Desktop/AKXA_width_calculate.bat.lnk";

app.use(cors());
app.use(bodyParser.json());
app.use('/images', express.static(path.join(imagesDir)));
app.use(express.static(distDir));

// Handle Socket.io connections
io.on('connection', (socket) => {
	console.log('🟢 A client connected');

	socket.on('disconnect', () => {
		console.log('🔴 A client disconnected');
	});
});

// const serialPort = new SerialPort({
// 	path: 'COM1',
// 	baudRate: 9600
// })

// Watch for new files in the folder
fs.watch(imagesDir, (eventType, filename) => {
	if (eventType === 'rename' && filename) {
		const filePath = path.join(imagesDir, filename);
		fs.access(filePath, (err) => {
			io.emit('new-image-detected', { filename });
			if (!err && filename.toLowerCase().includes('defect')) {
				console.log(`✅ New defect image detected: ${filename}`);

				// if(serialPort) {
				//   serialPort.write(1,(err) = {
				//     if(err) {
				//       console.log(err)
				//     }
				//   })
				// }
			}
		});
	}
});

// Optimized function to find the first "DEFECT" image
const findFirstImage = (dir) => {
	const items = fs.readdirSync(dir, { withFileTypes: true })
		.filter(item => item.isFile() && /\.(jpg|jpeg|png|gif)$/i.test(item.name) && item.name.includes('DEFECT'));

	return items.length > 0 ? path.relative(imagesDir, path.join(dir, items[0].name)).replace(/\\/g, '/') : null;
};

//API to find the next defect image
app.get('/api/next-image', (req, res) => {
	try {
		const imageFile = findFirstImage(imagesDir);
		res.json(imageFile || null);
	} catch (err) {
		res.status(500).json({ error: 'Failed to read images directory' });
	}
});

// Store defect image in SQLite Database
app.post('/api/tag-image', (req, res) => {
	const { image, dateTime, batchNo, feedback, severity, remark, type } = req.body;
	const ext = path.extname(image);
	const baseName = path.basename(image, ext);
	const newFileName = `${baseName}-QC-Checked${ext}`;
	const oldPath = path.join(imagesDir, image);
	const newPath = path.join(uploadsDir, newFileName);

	console.log(`Copying file from ${oldPath} to ${newPath}`);

	fs.copyFile(oldPath, newPath, (err) => {
		if (err) return res.status(500).json({ error: 'Failed to copy image' });

		fs.unlink(oldPath, (err) => {
			if (err) return res.status(500).json({ error: 'Failed to delete original image' });

			db.run(`INSERT INTO images (original_name, tagged_name, date_time, batch_no, feedback, severity, remark, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
				[image, newFileName, dateTime, batchNo, feedback, severity, remark, type], (err) => {
					if (err) return res.status(500).json({ error: 'Failed to insert image info into database' });

					res.json({ success: true });
				});
		});
	});
});

// API to download database as Excel file
app.get('/api/download-excel', (req, res) => {
	db.all("SELECT * FROM images", (err, rows) => {
		if (err) return res.status(500).json({ error: 'Failed to retrieve data from database' });

		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Images');

		const fileName = `images_${new Date().toISOString().replace(/[:.]/g, '-')}.xlsx`;
		res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
		res.send(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
	});
});

// API to calculate width
app.post('/api/calculateWidth', (req, res) => {
	let filePath = "C:/Users/Admin/Desktop/satwik/Width_calculation_by_SEG/thickness.txt";
	fs.writeFile(filePath, req.body.thickness, 'utf8', (err) => {
		if (err) return res.status(500).json({ error: 'Failed to write to file' });
	});

	exec(calWidthDir, (error, stdout, stderr) => {
		if (error || stderr) return res.status(500).send(`Error: ${error || stderr}`);
		res.send(stdout);
	});
});

// API to calculate length
app.post('/api/calculateLength', (req, res) => {
	let filePath = "C:/Users/Admin/Desktop/satwik/Width_calculation_by_SEG/thickness.txt";
	fs.writeFile(filePath, req.body.thickness, 'utf8', (err) => {
		if (err) return res.status(500).json({ error: 'Failed to write to file' });
	});

	exec("python3 C:/Users/Admin/Desktop/satwik/Width_calculation_by_SEG/length_check.py", (error, stdout, stderr) => {
		if (error) return res.status(500).json({ error: 'Failed to execute Python script', details: stderr });
		res.status(200).json({ data: stdout.trim() });
	});
});

// Serve the Vue app
app.get('*', (req, res) => {
	res.sendFile(path.join(distDir, 'index.html'));
});

// Start the server
server.listen(port, () => {
	console.log(`🚀 Server running on http://localhost:${port}`);
});
