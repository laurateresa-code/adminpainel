import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

// Plugin customizado para API de Backend simples
function backendPlugin() {
  return {
    name: 'backend-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Obter diretório raiz do projeto de forma segura
        const projectRoot = process.cwd();

        if (req.method === 'POST' && req.url === '/api/save-config') {
          let body = '';
          req.on('data', chunk => { body += chunk.toString(); });
          req.on('end', () => {
            try {
              const configPath = path.resolve(projectRoot, 'config/config.json');
              // Validar se é JSON válido
              const json = JSON.parse(body);
              fs.writeFileSync(configPath, JSON.stringify(json, null, 2));
              
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, message: 'Configuração salva com sucesso!' }));
            } catch (err) {
              console.error(err);
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        // Upload de imagens simples (Base64 -> Arquivo)
        if (req.method === 'POST' && req.url === '/api/upload-image') {
          let body = '';
          req.on('data', chunk => { body += chunk.toString(); });
          req.on('end', () => {
            try {
              const data = JSON.parse(body); // { filename: "...", content: "base64..." }
              const { filename, content, folder } = data;
              
              if (!filename || !content) {
                throw new Error('Filename and content required');
              }

              // Remover prefixo data:image/...;base64,
              const base64Data = content.replace(/^data:image\/\w+;base64,/, "");
              const buffer = Buffer.from(base64Data, 'base64');
              
              const targetFolder = folder ? `assets/images/${folder}` : 'assets/images';
              const targetPath = path.resolve(projectRoot, targetFolder);
              
              if (!fs.existsSync(targetPath)) {
                fs.mkdirSync(targetPath, { recursive: true });
              }
              
              const filePath = path.join(targetPath, filename);
              fs.writeFileSync(filePath, buffer);

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ 
                success: true, 
                path: `${targetFolder}/${filename}` 
              }));
            } catch (err) {
              console.error(err);
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [backendPlugin()],
  server: {
    host: true
  }
});
