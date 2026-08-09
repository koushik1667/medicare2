import React from 'react';
import { Button, Menu, MenuItem, Typography, Box } from '@mui/material';
import { Translate, KeyboardArrowDown } from '@mui/icons-material';
import { useLanguage, SUPPORTED_LANGUAGES, LanguageCode } from '../../contexts/LanguageContext';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code);
    handleClose();
  };

  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <Box>
      <Button
        color="inherit"
        startIcon={<Translate />}
        endIcon={<KeyboardArrowDown />}
        onClick={handleClick}
        sx={{ textTransform: 'none', borderRadius: 2 }}
      >
        <Typography variant="body2" sx={{ mr: 0.5 }}>
          {currentLangObj.flag} {currentLangObj.nativeName}
        </Typography>
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          elevation: 3,
          sx: { borderRadius: 2, minWidth: 160, mt: 1 },
        }}
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <MenuItem
            key={lang.code}
            selected={lang.code === language}
            onClick={() => handleSelect(lang.code)}
          >
            <Typography variant="body2" sx={{ mr: 1.5, fontSize: '1.1rem' }}>
              {lang.flag}
            </Typography>
            <Typography variant="body2" fontWeight={lang.code === language ? 600 : 400}>
              {lang.nativeName} ({lang.name})
            </Typography>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default LanguageSelector;
