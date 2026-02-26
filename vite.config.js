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

      // Middleware para URLs amigáveis (slugs)
      server.middlewares.use((req, res, next) => {
        // Ignorar requisições que já foram processadas ou são internas do Vite
        if (req.url.includes('?direct') || req.url.includes('v=')) {
          return next();
        }

        const url = req.url.split('?')[0];

        // 1. Ignorar explicitamente tudo o que o Vite precisa para funcionar e assets
        if (
          url.startsWith('/@vite/') || 
          url.startsWith('/@id/') || 
          url.startsWith('/node_modules/') ||
          url.startsWith('/api/') || 
          url.startsWith('/assets/') ||
          url.startsWith('/config/') ||
          url.startsWith('/sections/') ||
          url.endsWith('.js') ||
          url.endsWith('.css') ||
          url.endsWith('.json')
        ) {
          return next();
        }

        // 2. Lista de arquivos HTML conhecidos
        const htmlFiles = [
          '/', 
          '/index.html', 
          '/login.html', 
          '/dashboard.html', 
          '/admin.html', 
          '/view.html'
        ];

        if (htmlFiles.includes(url)) {
          return next();
        }

        // 3. Se o arquivo tem uma extensão, deixa o Vite tentar encontrar o arquivo físico
        if (url.includes('.')) {
          return next();
        }

        // 4. Se chegamos aqui e a URL tem mais de 1 caractere, assumimos que é um SLUG
        // Redirecionamos internamente para o view.html
        if (url.length > 1) {
          console.log(`[Slug Router] Redirecting ${url} to /view.html`);
          req.url = '/view.html';
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
