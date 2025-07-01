import React, { useState, useRef } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Alert,
  Divider,
  IconButton,
  Tooltip,
  Stack,
  SvgIcon,
  CssBaseline,
  Badge,
  Tabs,
  Tab,
  Link
} from '@mui/material';
import { 
    ContentCopy as CopyIcon, 
    Clear as ClearIcon, 
    UploadFile as UploadFileIcon,
    ReportProblem as ReportProblemIcon,
    Close as CloseIcon,
    Refresh as RefreshIcon,
    GitHub as GitHubIcon,
    Info as InfoIcon,
    Build as BuildIcon
} from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#dc004e',
        },
        background: {
            default: '#f4f6f8',
        }
    },
});

const aboutContent = `
## 关于此工具
这是一个简单而强大的SVG转Material-UI SvgIcon组件的在线转换工具。它可以帮助您快速地将SVG图标代码转换为可以直接在React项目中使用的MUI组件。
***
### 核心功能
* 直接粘贴SVG代码或上传SVG文件。
* 智能识别\`viewBox\`，或根据\`width\`/\`height\`自动生成。
* 实时预览转换后的图标效果。
* 实时调控\`viewBox\`，精确裁剪图标视野。
* 一键复制生成好的React组件代码。
`;

const markdownComponents = {
    h2: ({node, ...props}) => <Typography variant="h5" component="h2" gutterBottom {...props} />,
    h3: ({node, ...props}) => <Typography variant="h6" gutterBottom {...props} />,
    p: ({node, ...props}) => <Typography variant="body1" paragraph {...props} />,
    li: ({node, ...props}) => <li><Typography variant="body1" component="span" {...props} /></li>,
    a: ({node, ...props}) => <Link {...props} />,
    hr: () => <Divider sx={{ my: 2 }} />,
};


const App = () => {
  const [svgInput, setSvgInput] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState('');
  const [componentName, setComponentName] = useState('CustomIcon');
  const [copySuccess, setCopySuccess] = useState(false);
  const fileInputRef = useRef(null);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [viewBoxValues, setViewBoxValues] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const handleError = (errorMessage) => {
    setError(errorMessage);
    if (errorMessage) {
      setIsConsoleOpen(true);
    }
  };

  /**
   * 将CSS样式的字符串（例如 font-size: 12px; color: red;）
   * 转换为React的style对象（例如 { fontSize: '12px', color: 'red' }）
   * @param {string} styleString CSS样式字符串
   * @returns {object} React的style对象
   */
  const parseStyleStringToObject = (styleString) => {
    if (!styleString) return {};
    const styleObject = {};
    styleString.split(';').forEach(style => {
      const [property, value] = style.split(':');
      if (property && value) {
        const camelCaseProperty = property.trim().replace(/-([a-z])/g, g => g[1].toUpperCase());
        styleObject[camelCaseProperty] = value.trim();
      }
    });
    return styleObject;
  };

  /**
   * 递归解析SVG元素及其子元素
   * @param {Element} element 要解析的DOM元素
   * @returns {Array} 解析后的元素对象数组
   */
  const parseElementsRecursive = (element) => {
    return Array.from(element.children).map(child => {
      const attrs = {};
      for (const attr of child.attributes) {
        if (attr.name === 'style') {
          attrs.style = parseStyleStringToObject(attr.value);
        } else {
          const camelCaseName = attr.name.replace(/-([a-z])/g, g => g[1].toUpperCase());
          attrs[camelCaseName] = attr.value;
        }
      }

      const children = child.children.length > 0 ? parseElementsRecursive(child) : [];

      return {
        type: child.tagName.toLowerCase(),
        props: attrs,
        children: children,
      };
    });
  };

  const parseSvg = () => {
    handleError('');
    setParsedData(null);
    setViewBoxValues(null);

    if (!svgInput.trim()) {
      handleError('请输入SVG内容。');
      return;
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgInput, 'image/svg+xml');
      const svgElement = doc.querySelector('svg');

      const parseError = doc.querySelector('parsererror');
      if (parseError || !svgElement) {
        handleError(`无效的SVG格式。 ${parseError ? parseError.innerText : '找不到 <svg> 元素。'}`);
        return;
      }

      let viewBoxString = svgElement.getAttribute('viewBox');
      if (!viewBoxString) {
        const width = svgElement.getAttribute('width');
        const height = svgElement.getAttribute('height');
        if (width && height) {
          viewBoxString = `0 0 ${parseFloat(width)} ${parseFloat(height)}`;
        } else {
          viewBoxString = '0 0 24 24'; // 最终备用方案
        }
      }
      
      const elements = parseElementsRecursive(svgElement);

      if (elements.length === 0) {
        handleError('在SVG中没有找到有效的图形元素。');
        return;
      }
      
      const [minX, minY, width, height] = viewBoxString.split(' ').map(Number);
      setViewBoxValues({ minX, minY, width, height });

      setParsedData({
        elements,
        originalViewBox: viewBoxString,
      });
    } catch (err) {
      handleError('解析SVG时发生意外错误: ' + err.message);
    }
  };

  const handleViewBoxChange = (e) => {
    const { name, value } = e.target;
    setViewBoxValues(prev => ({
        ...prev,
        [name]: value === '' ? 0 : parseFloat(value)
    }));
  };

  const resetViewBox = () => {
    if (parsedData && parsedData.originalViewBox) {
        const [minX, minY, width, height] = parsedData.originalViewBox.split(' ').map(Number);
        setViewBoxValues({ minX, minY, width, height });
    }
  };

  const generateComponentCode = () => {
    if (!parsedData || !viewBoxValues) return '';
    const elementsJsx = generateJsxRecursive(parsedData.elements);
    const currentViewBox = `${viewBoxValues.minX} ${viewBoxValues.minY} ${viewBoxValues.width} ${viewBoxValues.height}`;

    return `import React from 'react';
import { SvgIcon } from '@mui/material';

const ${componentName} = (props) => {
  return (
    <SvgIcon {...props} viewBox="${currentViewBox}">
${elementsJsx}
    </SvgIcon>
  );
};

export default ${componentName};`;
  };
  
  const generateJsxRecursive = (elements, depth = 3) => {
    const indent = '  '.repeat(depth);
    return elements.map((element, index) => {
      const { type, props, children = [] } = element;
      
      const propsString = Object.entries(props)
          .map(([key, value]) => {
            if (key === 'style' && typeof value === 'object') {
              const styleProps = Object.entries(value)
                .map(([prop, val]) => `${prop}: '${val}'`)
                .join(', ');
              return `style={{ ${styleProps} }}`;
            }
            return `${key}="${value}"`;
          })
          .join(' ');
      
      if (children.length > 0) {
        return `${indent}<${type} key={${index}} ${propsString}>\n${generateJsxRecursive(children, depth + 1)}\n${indent}</${type}>`;
      }
      return `${indent}<${type} key={${index}} ${propsString} />`;
    }).join('\n');
  };

  const copyToClipboard = () => {
    const componentCode = generateComponentCode();
    const textArea = document.createElement('textarea');
    textArea.value = componentCode;
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2500);
    } catch (err) {
        console.error('复制失败: ', err);
        handleError('无法将代码复制到剪贴板。');
    }
    document.body.removeChild(textArea);
  };
  
  const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file) {
          if (file.type === 'image/svg+xml') {
            const reader = new FileReader();
            reader.onload = (event) => {
                setSvgInput(event.target.result);
                setTimeout(parseSvg, 100); 
            };
            reader.readAsText(file);
          } else {
              handleError("请上传一个有效的SVG文件。");
          }
      }
      e.target.value = null;
  };

  const clearAll = () => {
    setSvgInput('');
    setParsedData(null);
    setViewBoxValues(null);
    handleError('');
    setComponentName('CustomIcon');
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const renderPreviewRecursive = (elements) => {
    return elements.map((el, i) => {
        const children = el.children && el.children.length > 0 ? renderPreviewRecursive(el.children) : null;
        return React.createElement(el.type, { key: i, ...el.props }, children);
    });
  };

  const PreviewIcon = (parsedData && viewBoxValues) ? (props) => {
    const currentViewBox = `${viewBoxValues.minX} ${viewBoxValues.minY} ${viewBoxValues.width} ${viewBoxValues.height}`;
    return (
      <SvgIcon {...props} viewBox={currentViewBox}>
        {renderPreviewRecursive(parsedData.elements)}
      </SvgIcon>
    );
  } : () => null;

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', p: { xs: 2, md: 4 }, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 2, fontWeight: 'bold', color: 'text.primary' }}>
          SVG to Material-UI SvgIcon 转换工具
        </Typography>

        <Paper elevation={2} sx={{ mb: 4, maxWidth: 1400, mx: 'auto', width: '100%' }}>
            <Tabs value={activeTab} onChange={handleTabChange} centered>
                <Tab icon={<BuildIcon />} iconPosition="start" label="转换工具" />
                <Tab icon={<InfoIcon />} iconPosition="start" label="关于" />
                <Tab 
                    icon={<GitHubIcon />} 
                    iconPosition="start" 
                    label="GitHub" 
                    component="a" 
                    href="https://github.com/cytrogen/svg2svgicon" // 请替换为您的仓库地址
                    target="_blank" 
                    rel="noopener noreferrer"
                />
            </Tabs>
        </Paper>

        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            {activeTab === 0 && (
                <Box 
                sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', md: 'row' },
                    gap: 4,
                    maxWidth: 1400, 
                    mx: 'auto',
                    width: '100%',
                    flexGrow: 1,
                }}
                >
                {/* ... Input Panel ... */}
                <Paper 
                    elevation={3} 
                    sx={{ p: 3, borderRadius: 2, flex: 1, minWidth: 0 }}
                >
                    <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">输入</Typography>
                        <Tooltip title="清空所有">
                            <IconButton onClick={clearAll} size="small" color="secondary">
                                <ClearIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                    <TextField
                        label="组件名称"
                        value={componentName}
                        onChange={(e) => setComponentName(e.target.value.replace(/[^a-zA-Z0-9_]/g, '') || 'CustomIcon')}
                        size="small"
                        placeholder="例如: HomeIcon"
                    />
                    <TextField
                        multiline
                        rows={12}
                        value={svgInput}
                        onChange={(e) => setSvgInput(e.target.value)}
                        placeholder={"在此处粘贴您的SVG代码...\n\n<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\">\n  <path d=\"M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z\"/>\n</svg>"}
                        variant="outlined"
                        sx={{ fontFamily: 'monospace', '& textarea': { fontSize: '0.9rem' } }}
                    />
                    <Stack direction="row" spacing={2}>
                        <Button
                        variant="contained"
                        onClick={parseSvg}
                        disabled={!svgInput.trim()}
                        fullWidth
                        >
                        转换SVG
                        </Button>
                        <Button
                        variant="outlined"
                        onClick={() => fileInputRef.current.click()}
                        startIcon={<UploadFileIcon />}
                        fullWidth
                        >
                        导入文件
                        </Button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/svg+xml"
                            hidden
                        />
                    </Stack>
                    </Stack>
                </Paper>

                {/* Output Panel */}
                <Paper 
                    elevation={3} 
                    sx={{ p: 3, borderRadius: 2, flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}
                >
                    <Stack spacing={2} sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">输出</Typography>
                        {parsedData && (
                        <Tooltip title={copySuccess ? "已复制!" : "复制代码"}>
                            <Button
                            onClick={copyToClipboard}
                            color="primary"
                            variant="contained"
                            size="small"
                            startIcon={<CopyIcon />}
                            >
                            {copySuccess ? "已复制!" : "复制代码"}
                            </Button>
                        </Tooltip>
                        )}
                    </Box>

                    {parsedData ? (
                        <Stack spacing={2} divider={<Divider />} sx={{ flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>图标预览</Typography>
                            <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'center', 
                                alignItems: 'center',
                                p: 2, 
                                mt: 1,
                                minHeight: 120,
                                bgcolor: 'grey.100',
                                borderRadius: 1,
                                border: '1px dashed',
                                borderColor: 'grey.300'
                            }}>
                                <PreviewIcon sx={{ fontSize: 80, color: 'primary.main' }} />
                            </Box>
                        </Box>
                        
                        {viewBoxValues && (
                            <Box>
                                <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1}}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>ViewBox 控制器</Typography>
                                    <Tooltip title="重置为原始值">
                                        <IconButton onClick={resetViewBox} size="small">
                                            <RefreshIcon />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                                <Stack direction="row" spacing={1}>
                                    <TextField label="min-x" type="number" name="minX" value={viewBoxValues.minX} onChange={handleViewBoxChange} size="small" />
                                    <TextField label="min-y" type="number" name="minY" value={viewBoxValues.minY} onChange={handleViewBoxChange} size="small" />
                                    <TextField label="width" type="number" name="width" value={viewBoxValues.width} onChange={handleViewBoxChange} size="small" />
                                    <TextField label="height" type="number" name="height" value={viewBoxValues.height} onChange={handleViewBoxChange} size="small" />
                                </Stack>
                            </Box>
                        )}

                        {/* FIX: Overflow Y fix */}
                        <Box sx={{ flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 1 }}>React 组件代码</Typography>
                            <TextField
                                multiline
                                fullWidth
                                value={generateComponentCode()}
                                variant="outlined"
                                InputProps={{
                                readOnly: true,
                                sx: { 
                                    fontFamily: 'monospace', 
                                    fontSize: '0.85rem', 
                                    bgcolor: 'grey.50',
                                    height: '100%',
                                    overflowY: 'auto'
                                }
                                }}
                                sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}
                            />
                        </Box>
                        </Stack>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', flexGrow: 1, color: 'text.secondary', textAlign: 'center' }}>
                        <Typography variant="h6">您的组件将显示在此处</Typography>
                        <Typography variant="body2">在左侧输入SVG并点击“转换SVG”</Typography>
                        </Box>
                    )}
                    </Stack>
                </Paper>
                </Box>
            )}
            {activeTab === 1 && (
                <Paper elevation={3} sx={{ p: 4, maxWidth: 800, mx: 'auto', width: '100%' }}>
                    <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
                        {aboutContent}
                    </ReactMarkdown>
                    <Alert severity="info" icon={<InfoIcon />} sx={{ mt: 2 }}>
                        <strong>纯客户端处理：</strong> 您的所有数据，包括您上传或粘贴的SVG代码，都只在您的浏览器中进行处理。我们不会将您的任何数据发送到服务器，您的隐私和数据安全得到完全保障。
                    </Alert>
                </Paper>
            )}
        </Box>
      </Box>

      {/* 错误控制台触发按钮 */}
      <Tooltip title="显示/隐藏错误控制台">
        <IconButton
            onClick={() => setIsConsoleOpen(true)}
            sx={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                zIndex: 1200,
                bgcolor: 'secondary.main',
                color: 'white',
                '&:hover': { bgcolor: 'secondary.dark' },
                transform: isConsoleOpen ? 'scale(0)' : 'scale(1)',
                transition: 'transform 0.2s'
            }}
        >
            <Badge color="error" variant="dot" invisible={!error}>
                <ReportProblemIcon />
            </Badge>
        </IconButton>
      </Tooltip>

      {/* 错误控制台面板 */}
      <Paper
        elevation={16}
        sx={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: 'clamp(300px, 30vw, 500px)',
            transform: isConsoleOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: (theme) => theme.transitions.create('transform', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
            }),
            zIndex: 1300,
            display: 'flex',
            flexDirection: 'column',
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.main', color: 'white' }}>
            <Typography variant="h6">错误控制台</Typography>
            <IconButton onClick={() => setIsConsoleOpen(false)} color="inherit">
                <CloseIcon />
            </IconButton>
        </Box>
        <Divider />
        <Box sx={{ p: 2, flexGrow: 1, overflowY: 'auto', bgcolor: 'background.paper' }}>
            {error ? (
                <Alert severity="error" sx={{ whiteSpace: 'pre-wrap' }}>{error}</Alert>
            ) : (
                <Typography sx={{ color: 'text.secondary', textAlign: 'center', mt: 4 }}>没有错误。</Typography>
            )}
        </Box>
        <Divider />
        <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
            <Button 
                variant="contained" 
                onClick={() => handleError('')} 
                fullWidth
            >
                清除错误
            </Button>
        </Box>
      </Paper>
    </ThemeProvider>
  );
};

export default App;
