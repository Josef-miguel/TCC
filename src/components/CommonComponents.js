// src/components/CommonComponents.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Componente de Botão Padronizado
export const StandardButton = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  icon,
  style,
  textStyle,
  theme,
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[`button_${size}`]];
    
    switch (variant) {
      case 'primary':
        return [...baseStyle, { backgroundColor: theme?.primary }];
      case 'secondary':
        return [...baseStyle, { 
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: theme?.primary 
        }];
      case 'outline':
        return [...baseStyle, { 
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: theme?.border 
        }];
      case 'ghost':
        return [...baseStyle, { backgroundColor: 'transparent' }];
      default:
        return [...baseStyle, { backgroundColor: theme?.primary }];
    }
  };

  const getTextStyle = () => {
    const baseStyle = [styles.buttonText, styles[`buttonText_${size}`]];
    
    switch (variant) {
      case 'primary':
        return [...baseStyle, { color: theme?.textInverted }];
      case 'secondary':
      case 'outline':
        return [...baseStyle, { color: theme?.primary }];
      case 'ghost':
        return [...baseStyle, { color: theme?.textPrimary }];
      default:
        return [...baseStyle, { color: theme?.textInverted }];
    }
  };

  return (
    <TouchableOpacity
      style={[
        getButtonStyle(),
        disabled && styles.buttonDisabled,
        style
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <View style={styles.buttonContent}>
        {icon && (
          <Ionicons 
            name={icon} 
            size={size === 'small' ? 16 : size === 'large' ? 24 : 20} 
            color={getTextStyle()[getTextStyle().length - 1]?.color || theme?.textInverted}
            style={styles.buttonIcon}
          />
        )}
        <Text style={[getTextStyle(), textStyle]}>
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// Componente de Input Padronizado
export const StandardInput = ({
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  icon,
  error,
  disabled = false,
  style,
  theme,
  ...props
}) => {
  return (
    <View style={styles.inputContainer}>
      <View style={[
        styles.inputWrapper,
        { 
          backgroundColor: theme?.backgroundSecondary,
          borderColor: error ? theme?.error : theme?.border,
          opacity: disabled ? 0.6 : 1
        },
        style
      ]}>
        {icon && (
          <Ionicons 
            name={icon} 
            size={20} 
            color={theme?.textTertiary}
            style={styles.inputIcon}
          />
        )}
        <TextInput
          style={[
            styles.input,
            { color: theme?.textPrimary },
            multiline && styles.inputMultiline
          ]}
          placeholder={placeholder}
          placeholderTextColor={theme?.textTertiary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={!disabled}
          {...props}
        />
      </View>
      {error && (
        <Text style={[styles.errorText, { color: theme?.error }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

// Componente de Card Padronizado
export const StandardCard = ({
  children,
  style,
  theme,
  elevation = 2,
  padding = 16,
}) => {
  return (
    <View style={[
      styles.card,
      {
        backgroundColor: theme?.cardBackground,
        shadowColor: theme?.mode === 'dark' ? '#000' : 'rgba(0,0,0,0.1)',
        elevation: elevation,
        padding: padding,
      },
      style
    ]}>
      {children}
    </View>
  );
};

// Componente de Header Padronizado
export const StandardHeader = ({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  onLeftPress,
  onRightPress,
  style,
  theme,
}) => {
  return (
    <View style={[styles.header, { backgroundColor: theme?.background }, style]}>
      <View style={styles.headerContent}>
        {leftIcon && (
          <TouchableOpacity 
            onPress={onLeftPress}
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <Ionicons name={leftIcon} size={24} color={theme?.textPrimary} />
          </TouchableOpacity>
        )}
        
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme?.textPrimary }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.headerSubtitle, { color: theme?.textSecondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
        
        {rightIcon && (
          <TouchableOpacity 
            onPress={onRightPress}
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <Ionicons name={rightIcon} size={24} color={theme?.textPrimary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Componente de Badge Padronizado
export const StandardBadge = ({
  text,
  variant = 'default',
  size = 'medium',
  icon,
  style,
  theme,
}) => {
  const getBadgeStyle = () => {
    const baseStyle = [styles.badge, styles[`badge_${size}`]];
    
    switch (variant) {
      case 'primary':
        return [...baseStyle, { backgroundColor: theme?.primary }];
      case 'success':
        return [...baseStyle, { backgroundColor: theme?.success }];
      case 'warning':
        return [...baseStyle, { backgroundColor: theme?.warning }];
      case 'error':
        return [...baseStyle, { backgroundColor: theme?.error }];
      case 'info':
        return [...baseStyle, { backgroundColor: theme?.info }];
      default:
        return [...baseStyle, { backgroundColor: theme?.backgroundDark }];
    }
  };

  const getTextStyle = () => {
    const baseStyle = [styles.badgeText, styles[`badgeText_${size}`]];
    
    switch (variant) {
      case 'primary':
      case 'success':
      case 'warning':
      case 'error':
      case 'info':
        return [...baseStyle, { color: theme?.textInverted }];
      default:
        return [...baseStyle, { color: theme?.textPrimary }];
    }
  };

  return (
    <View style={[getBadgeStyle(), style]}>
      {icon && (
        <Ionicons 
          name={icon} 
          size={size === 'small' ? 12 : size === 'large' ? 16 : 14} 
          color={getTextStyle()[getTextStyle().length - 1]?.color || theme?.textPrimary}
          style={styles.badgeIcon}
        />
      )}
      <Text style={getTextStyle()}>
        {text}
      </Text>
    </View>
  );
};

// Componente de Avatar Padronizado
export const StandardAvatar = ({
  source,
  size = 'medium',
  fallbackIcon = 'person',
  style,
  theme,
}) => {
  const getSize = () => {
    switch (size) {
      case 'small': return 32;
      case 'large': return 64;
      case 'xlarge': return 80;
      default: return 48;
    }
  };

  const avatarSize = getSize();

  return (
    <View style={[
      styles.avatar,
      {
        width: avatarSize,
        height: avatarSize,
        borderRadius: avatarSize / 2,
        backgroundColor: theme?.backgroundDark,
      },
      style
    ]}>
      {source ? (
        <Image
          source={{ uri: source }}
          style={[
            styles.avatarImage,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
            }
          ]}
          resizeMode="cover"
        />
      ) : (
        <Ionicons 
          name={fallbackIcon} 
          size={avatarSize * 0.5} 
          color={theme?.textTertiary} 
        />
      )}
    </View>
  );
};

// Componente de Loading Padronizado
export const StandardLoading = ({
  size = 'medium',
  color,
  style,
  theme,
}) => {
  const getSize = () => {
    switch (size) {
      case 'small': return 20;
      case 'large': return 40;
      default: return 30;
    }
  };

  return (
    <View style={[styles.loadingContainer, style]}>
      <Ionicons 
        name="refresh" 
        size={getSize()} 
        color={color || theme?.primary}
        style={styles.loadingIcon}
      />
    </View>
  );
};

// Componente de Divider Padronizado
export const StandardDivider = ({
  style,
  theme,
  orientation = 'horizontal',
}) => {
  return (
    <View style={[
      styles.divider,
      {
        backgroundColor: theme?.divider,
        ...(orientation === 'vertical' ? styles.dividerVertical : styles.dividerHorizontal)
      },
      style
    ]} />
  );
};

const styles = StyleSheet.create({
  // Botão
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  button_small: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
  },
  button_medium: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  button_large: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 52,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonText_small: {
    fontSize: 14,
  },
  buttonText_medium: {
    fontSize: 16,
  },
  buttonText_large: {
    fontSize: 18,
  },

  // Input
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  inputMultiline: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },

  // Card
  card: {
    borderRadius: 16,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginVertical: 8,
  },

  // Header
  header: {
    paddingTop: 44,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
    textAlign: 'center',
  },

  // Badge
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  badge_small: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badge_medium: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badge_large: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeIcon: {
    marginRight: 4,
  },
  badgeText: {
    fontWeight: '600',
  },
  badgeText_small: {
    fontSize: 10,
  },
  badgeText_medium: {
    fontSize: 12,
  },
  badgeText_large: {
    fontSize: 14,
  },

  // Avatar
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    position: 'absolute',
  },

  // Loading
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingIcon: {
    transform: [{ rotate: '0deg' }],
  },

  // Divider
  divider: {
    backgroundColor: '#e0e0e0',
  },
  dividerHorizontal: {
    height: 1,
    width: '100%',
  },
  dividerVertical: {
    width: 1,
    height: '100%',
  },
});
