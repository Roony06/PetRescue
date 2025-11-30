import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, FlatList, ScrollView, Image, Modal, Animated, Easing, LayoutAnimation, Platform, UIManager, Share, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

export default function App() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState({}); // { [email]: { name, password } }
  const [activeTab, setActiveTab] = useState('inicio'); // 'inicio' | 'difusion' | 'exitos' | 'guia' | 'ayuda'
  const [showAuthPanel, setShowAuthPanel] = useState(false);
  const tabsAnimIndex = useRef(new Animated.Value(0)).current;
  const [tabsWidth, setTabsWidth] = useState(0);
  const tabsList = ['inicio', 'difusion', 'exitos', 'guia', 'ayuda'];
  // Estado de campañas tipo Wako
  const [campaignStep, setCampaignStep] = useState(1); // 1 datos, 2 preview, 3 plan
  const [campaign, setCampaign] = useState({
    tipo: 'Gato',
    nombre: '',
    zona: '',
    colonia: '',
    radioKm: '3',
    telefono: '',
    texto: '',
    imageUrl: '',
  });
  const [selectedPlan, setSelectedPlan] = useState('Lassie'); // Lassie | Garfield | Beethoven
  const [activeCampaigns, setActiveCampaigns] = useState([]);
  const [faqOpen, setFaqOpen] = useState({});
  const getSeedPosts = () => {
    const now = Date.now();
    const barrios = [
      { colonia: 'Centro', lugar: 'Plaza Patria' },
      { colonia: 'San Marcos', lugar: 'Jardín de San Marcos' },
      { colonia: 'Héroes', lugar: 'Av. Héroe de Nacozari' },
      { colonia: 'Altaria', lugar: 'Centro Comercial Altaria' },
      { colonia: 'Ojocaliente', lugar: 'Parque Ojocaliente' },
      { colonia: 'Bosques', lugar: 'Bosques del Prado' },
      { colonia: 'Morelos', lugar: 'Mercado Morelos' },
      { colonia: 'Guadalupe', lugar: 'Templo de Guadalupe' },
      { colonia: 'Trojes', lugar: 'Las Trojes' },
      { colonia: 'Rodolfo Landeros', lugar: 'Parque Rodolfo Landeros' },
    ];
    const imgsGatos = [
      'https://images.unsplash.com/photo-1595433562696-4b62c4c89a3a?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1574158622682-e40e69881006?q=80&w=800&auto=format&fit=crop',
    ];
    const imgsPerros = [
      'https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?q=80&w=800&auto=format&fit=crop',
    ];
    const nombresGato = ['Michi', 'Bigotes', 'Luna', 'Kiwi', 'Nube', 'Coco'];
    const nombresPerro = ['Firulais', 'Bobby', 'Max', 'Lola', 'Rocky', 'Canela'];
    const sexos = ['Macho', 'Hembra'];
    const estados = ['Perdido', 'Visto', 'Encontrado'];
    const seed = [];
    for (let i = 0; i < 12; i++) {
      const isCat = i % 2 === 0;
      const barrio = barrios[i % barrios.length];
      const nombre = isCat ? nombresGato[i % nombresGato.length] : nombresPerro[i % nombresPerro.length];
      seed.push({
        id: `seed-${i}`,
        tipo: isCat ? 'Gato' : 'Perro',
        nombre,
        caracteristicas: isCat
          ? 'Gato doméstico, amistoso, responde a su nombre'
          : 'Perro mediano, lleva collar, muy dócil',
        domicilio: `Aguascalientes, ${barrio.colonia}`,
        ciudad: 'Aguascalientes',
        colonia: barrio.colonia,
        telefono: `449-${Math.floor(100 + Math.random()*900)}-${Math.floor(1000 + Math.random()*9000)}`,
        fecha: new Date(now - i * 86400000).toISOString(),
        imageUrl: (isCat ? imgsGatos : imgsPerros)[i % 3],
        postedBy: 'demo@petrescue.com',
        ultimoLugar: barrio.lugar,
        recompensa: i % 3 === 0 ? `${(i+1) * 500}` : '',
        estado: estados[i % estados.length],
        sexo: sexos[i % 2],
        edad: i % 5 === 0 ? 'Cachorro' : i % 4 === 0 ? 'Adulto' : 'Joven',
        color: isCat ? 'Gris/Blanco' : 'Café/Blanco',
        raza: isCat ? 'Doméstico' : (i % 2 ? 'Mestizo' : 'Labrador'),
        ultimaHora: '18:30',
        comments: [],
      });
    }
    return seed;
  };
  const [posts, setPosts] = useState(getSeedPosts());
  const [newPost, setNewPost] = useState({
    tipo: 'Gato',
    nombre: '',
    caracteristicas: '',
    domicilio: '',
    colonia: '',
    telefono: '',
    imageUrl: '',
    ultimoLugar: '',
    recompensa: '',
    estado: 'Perdido',
    sexo: 'Macho',
    edad: '',
    color: '',
    raza: '',
    ultimaHora: '',
    notas: '',
  });
  const [contactingPostId, setContactingPostId] = useState(null);
  const [contactMessageText, setContactMessageText] = useState('');
  const [messages, setMessages] = useState([
    { id: 'm1', author: 'Sistema', text: 'Bienvenido al foro de mascotas desaparecidas.' },
  ]);
  const [messageText, setMessageText] = useState('');
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState('Todos'); // Todos | Gato | Perro
  const [sortBy, setSortBy] = useState('recientes'); // recientes | antiguos | nombre
  const [selectedPost, setSelectedPost] = useState(null);
  const introFade = useRef(new Animated.Value(0)).current;

  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  const validateLogin = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      return 'El correo es obligatorio.';
    }
    if (!emailRegex.test(email.trim())) {
      return 'Ingresa un correo válido.';
    }
    if (!password) {
      return 'La contraseña es obligatoria.';
    }
    if (password.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }
    return '';
  };

  const validateSignup = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!name.trim()) {
      return 'El nombre es obligatorio.';
    }
    if (!email.trim() || !emailRegex.test(email.trim())) {
      return 'Ingresa un correo válido.';
    }
    if (!password || password.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }
    if (password !== confirmPassword) {
      return 'Las contraseñas no coinciden.';
    }
    if (registeredUsers[email.trim().toLowerCase()]) {
      return 'Este correo ya está registrado.';
    }
    return '';
  };

  const handleLogin = async () => {
    const validationError = validateLogin();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }
    setErrorMessage('');
    setIsLoading(true);
    try {
      // Simulación de autenticación (reemplazar por tu backend)
      await new Promise(resolve => setTimeout(resolve, 1000));
      const lower = email.trim().toLowerCase();
      const demoValid = lower === 'usuario@demo.com' && password === '123456';
      const user = registeredUsers[lower];
      const userValid = user && user.password === password;
      const isValid = demoValid || userValid;
      if (!isValid) {
        setErrorMessage('Credenciales incorrectas. Usa usuario@demo.com / 123456 para probar.');
        setIsAuthenticated(false);
        return;
      }
      setIsAuthenticated(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    const validationError = validateSignup();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }
    setErrorMessage('');
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const lower = email.trim().toLowerCase();
      setRegisteredUsers(prev => ({
        ...prev,
        [lower]: { name: name.trim(), password },
      }));
      setMode('login');
      setPassword('');
      setConfirmPassword('');
      setErrorMessage('Cuenta creada. Ahora inicia sesión.');
    } finally {
      setIsLoading(false);
    }
  };

  const switchTo = (nextMode) => {
    setMode(nextMode);
    setErrorMessage('');
    setIsLoading(false);
    setPassword('');
    setConfirmPassword('');
  };

  const resetAuthFields = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrorMessage('');
  };

  // Persistencia básica de posts y usuarios
  useEffect(() => {
    (async () => {
      try {
        const savedPosts = await AsyncStorage.getItem('PR_POSTS');
        if (savedPosts) {
          setPosts(JSON.parse(savedPosts));
        } else {
          // Si no hay datos, sembramos con Aguascalientes
          setPosts(getSeedPosts());
        }
        const savedUsers = await AsyncStorage.getItem('PR_USERS');
        if (savedUsers) setRegisteredUsers(JSON.parse(savedUsers));
        const savedCampaigns = await AsyncStorage.getItem('PR_CAMPAIGNS');
        if (savedCampaigns) setActiveCampaigns(JSON.parse(savedCampaigns));
      } catch {}
    })();
    Animated.timing(introFade, { toValue: 1, duration: 600, useNativeDriver: true, easing: Easing.out(Easing.ease) }).start();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('PR_POSTS', JSON.stringify(posts)).catch(() => {});
  }, [posts]);

  useEffect(() => {
    AsyncStorage.setItem('PR_USERS', JSON.stringify(registeredUsers)).catch(() => {});
  }, [registeredUsers]);
  useEffect(() => {
    AsyncStorage.setItem('PR_CAMPAIGNS', JSON.stringify(activeCampaigns)).catch(() => {});
  }, [activeCampaigns]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setErrorMessage('Permiso denegado para acceder a la galería.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.length) {
      setNewPost(p => ({ ...p, imageUrl: result.assets[0].uri }));
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
  };
  const pickCampaignImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setErrorMessage('Permiso denegado para acceder a la galería.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.length) {
      setCampaign(p => ({ ...p, imageUrl: result.assets[0].uri }));
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
  };
  const autoTextForCampaign = (c) => {
    const nombre = c.nombre?.trim() || 'mi mascota';
    const zona = c.colonia?.trim() || c.zona?.trim() || 'tu barrio';
    const tel = c.telefono?.trim() || 'tu WhatsApp';
    return `AYUDA A ENCONTRAR A ${nombre.toUpperCase()}\nPerdido cerca de ${zona}. Si lo ves, contáctame al ${tel}.`;
  };
  const shareCampaign = async () => {
    const previewText = campaign.texto?.trim() || autoTextForCampaign(campaign);
    try {
      await Share.share({
        message: previewText,
      });
    } catch {}
  };
  const contactExpertWhatsApp = () => {
    const msg = encodeURIComponent('Hola, necesito ayuda para activar una campaña de difusión para mi mascota.');
    const url = `https://wa.me/5491112345678?text=${msg}`;
    Linking.openURL(url).catch(() => {});
  };
  const confirmCampaignPayment = () => {
    // Simulación de pago/activación
    const now = new Date().toISOString();
    const planInfo = selectedPlan === 'Lassie'
      ? { dias: 4, alcance: '8.5k–18.5k' }
      : selectedPlan === 'Garfield'
      ? { dias: 8, alcance: '68.5k–82.5k' }
      : { dias: 15, alcance: '120.5k–212.5k' };
    const newItem = {
      id: Math.random().toString(36).slice(2),
      ...campaign,
      texto: campaign.texto?.trim() || autoTextForCampaign(campaign),
      plan: selectedPlan,
      fecha: now,
      estado: 'Activa',
      alcanceEstimado: planInfo.alcance,
      dias: planInfo.dias,
    };
    setActiveCampaigns(prev => [newItem, ...prev]);
    // Reset del flujo
    setCampaign({
      tipo: 'Gato',
      nombre: '',
      zona: '',
      colonia: '',
      radioKm: '3',
      telefono: '',
      texto: '',
      imageUrl: '',
    });
    setSelectedPlan('Lassie');
    setCampaignStep(1);
    setErrorMessage('Campaña activada (simulación).');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  const addPost = () => {
    const phoneOk = newPost.telefono.trim().length >= 7;
    if (!isAuthenticated) {
      setErrorMessage('Debes iniciar sesión para publicar un reporte.');
      setShowAuthPanel(true);
      return;
    }
    if (!newPost.nombre.trim() || !newPost.caracteristicas.trim() || !newPost.domicilio.trim() || !phoneOk || !newPost.ultimoLugar.trim()) {
      setErrorMessage('Completa nombre, características, domicilio, último lugar visto y un teléfono válido.');
      return;
    }
    const created = {
      id: Math.random().toString(36).slice(2),
      ...newPost,
      fecha: new Date().toISOString(),
      postedBy: email || 'usuario@desconocido',
      comments: [],
    };
    setPosts(prev => [created, ...prev]);
    setNewPost({ tipo: newPost.tipo, nombre: '', caracteristicas: '', domicilio: '', telefono: '', imageUrl: '' });
    setErrorMessage('');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  const sendMessage = () => {
    if (!isAuthenticated) {
      setErrorMessage('Debes iniciar sesión para enviar mensajes.');
      return;
    }
    const text = messageText.trim();
    if (!text) return;
    const author = name || email;
    setMessages(prev => [...prev, { id: Math.random().toString(36).slice(2), author, text }]);
    setMessageText('');
  };

  const contactPostAuthor = (postId) => {
    if (!isAuthenticated) {
      setErrorMessage('Debes iniciar sesión para contactar al autor.');
      setShowAuthPanel(true);
      return;
    }
    setContactingPostId(postId === contactingPostId ? null : postId);
    setContactMessageText('');
  };

  const sendContactMessage = (post) => {
    if (!contactMessageText.trim()) return;
    // Simulación de envío
    setContactingPostId(null);
    setContactMessageText('');
    setErrorMessage(`Mensaje enviado al autor del reporte de ${post.nombre}.`);
  };

  const isSignup = mode === 'signup';

  return (
    <View style={styles.container}>
      

      <View style={styles.tabs}>
        <View
          style={{ position: 'absolute', bottom: 0, height: 3, width: '100%', backgroundColor: '#000' }}
          onLayout={(e) => setTabsWidth(e.nativeEvent.layout.width)}
        />
        {!!tabsWidth && (
          <Animated.View
            style={[
              styles.tabsIndicator,
              {
                width: tabsWidth / tabsList.length,
                transform: [
                  {
                    translateX: tabsAnimIndex.interpolate({
                      inputRange: [0, tabsList.length - 1],
                      outputRange: [0, (tabsWidth / tabsList.length) * (tabsList.length - 1)],
                    }),
                  },
                ],
              },
            ]}
          />
        )}
        <TouchableOpacity
          style={[styles.tab]}
          onPress={() => {
            setActiveTab('inicio');
            Animated.timing(tabsAnimIndex, { toValue: 0, duration: 200, useNativeDriver: true, easing: Easing.out(Easing.ease) }).start();
          }}
        >
          <Text style={[styles.tabText, activeTab === 'inicio' && styles.tabTextActive]}>Inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab]}
          onPress={() => {
            setActiveTab('difusion');
            Animated.timing(tabsAnimIndex, { toValue: 1, duration: 200, useNativeDriver: true, easing: Easing.out(Easing.ease) }).start();
          }}
        >
          <Text style={[styles.tabText, activeTab === 'difusion' && styles.tabTextActive]}>Difusión</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab]}
          onPress={() => {
            setActiveTab('exitos');
            Animated.timing(tabsAnimIndex, { toValue: 2, duration: 200, useNativeDriver: true, easing: Easing.out(Easing.ease) }).start();
          }}
        >
          <Text style={[styles.tabText, activeTab === 'exitos' && styles.tabTextActive]}>Éxitos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab]}
          onPress={() => {
            setActiveTab('guia');
            Animated.timing(tabsAnimIndex, { toValue: 3, duration: 200, useNativeDriver: true, easing: Easing.out(Easing.ease) }).start();
          }}
        >
          <Text style={[styles.tabText, activeTab === 'guia' && styles.tabTextActive]}>Qué hacer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab]}
          onPress={() => {
            setActiveTab('ayuda');
            Animated.timing(tabsAnimIndex, { toValue: 4, duration: 200, useNativeDriver: true, easing: Easing.out(Easing.ease) }).start();
          }}
        >
          <Text style={[styles.tabText, activeTab === 'ayuda' && styles.tabTextActive]}>Ayuda</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'inicio' ? (
        <ScrollView style={{ width: '100%' }} contentContainerStyle={{ alignItems: 'center' }}>
          <Animated.View style={[styles.card, { width: '88%', opacity: introFade }]}>
            <Text style={styles.title}>Pet Rescue</Text>
            <Text style={{ color: '#E5E7EB', marginBottom: 8, textAlign: 'center' }}>
              Somos una red social solidaria para ayudar a reencontrar mascotas. Publica reportes con foto, zona y contacto. La comunidad puede avisar si hay pistas o avistamientos.
            </Text>
            <View style={{ marginTop: 8, marginBottom: 8 }}>
              <Text style={{ color: '#9CA3AF', textAlign: 'center' }}>
                Operamos en Aguascalientes y alrededores. Teléfonos de contacto usan lada 449.
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 8 }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: '#D4AF37', fontWeight: '700' }}>Reporta</Text>
                <Text style={{ color: '#9CA3AF', fontSize: 12 }}>Crea una ficha completa</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: '#D4AF37', fontWeight: '700' }}>Comparte</Text>
                <Text style={{ color: '#9CA3AF', fontSize: 12 }}>Difunde con tu red</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: '#D4AF37', fontWeight: '700' }}>Conecta</Text>
                <Text style={{ color: '#9CA3AF', fontSize: 12 }}>Contacta al autor</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 12 }}>
              <TouchableOpacity style={styles.button} activeOpacity={0.8} onPress={() => {
                setActiveTab('difusion');
              }}>
                <Text style={styles.buttonText}>Comenzar difusión</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
          {/* Resumen rápido */}
          <View style={[styles.card, { width: '88%', marginTop: 8 }]}>
            {(() => {
              const total = posts.length;
              const gatos = posts.filter(p => p.tipo === 'Gato').length;
              const perros = total - gatos;
              const perdidos = posts.filter(p => p.estado === 'Perdido').length;
              const vistos = posts.filter(p => p.estado === 'Visto').length;
              const encontrados = posts.filter(p => p.estado === 'Encontrado').length;
              return (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ alignItems: 'center', flex: 1 }}>
                    <Text style={{ color: '#D4AF37', fontWeight: '800', fontSize: 18 }}>{total}</Text>
                    <Text style={{ color: '#9CA3AF' }}>Total</Text>
                  </View>
                  <View style={{ alignItems: 'center', flex: 1 }}>
                    <Text style={{ color: '#D4AF37', fontWeight: '800', fontSize: 18 }}>{gatos}</Text>
                    <Text style={{ color: '#9CA3AF' }}>Gatos</Text>
                  </View>
                  <View style={{ alignItems: 'center', flex: 1 }}>
                    <Text style={{ color: '#D4AF37', fontWeight: '800', fontSize: 18 }}>{perros}</Text>
                    <Text style={{ color: '#9CA3AF' }}>Perros</Text>
                  </View>
                  <View style={{ alignItems: 'center', flex: 1 }}>
                    <Text style={{ color: '#D4AF37', fontWeight: '800', fontSize: 18 }}>{perdidos}</Text>
                    <Text style={{ color: '#9CA3AF' }}>Perdidos</Text>
                  </View>
                  <View style={{ alignItems: 'center', flex: 1 }}>
                    <Text style={{ color: '#D4AF37', fontWeight: '800', fontSize: 18 }}>{vistos}</Text>
                    <Text style={{ color: '#9CA3AF' }}>Vistos</Text>
                  </View>
                  <View style={{ alignItems: 'center', flex: 1 }}>
                    <Text style={{ color: '#D4AF37', fontWeight: '800', fontSize: 18 }}>{encontrados}</Text>
                    <Text style={{ color: '#9CA3AF' }}>Encontrados</Text>
                  </View>
                </View>
              );
            })()}
          </View>
          {isAuthenticated && (
          <View style={styles.card}>
            <Text style={styles.title}>Nuevo reporte</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <TouchableOpacity
                style={[styles.chip, newPost.tipo === 'Gato' && styles.chipActive]}
                onPress={() => setNewPost(p => ({ ...p, tipo: 'Gato' }))}
              >
                <Text style={[styles.chipText, newPost.tipo === 'Gato' && styles.chipTextActive]}>Gato</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.chip, newPost.tipo === 'Perro' && styles.chipActive]}
                onPress={() => setNewPost(p => ({ ...p, tipo: 'Perro' }))}
              >
                <Text style={[styles.chipText, newPost.tipo === 'Perro' && styles.chipTextActive]}>Perro</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Nombre de la mascota"
              value={newPost.nombre}
              onChangeText={v => setNewPost(p => ({ ...p, nombre: v }))}
              placeholderTextColor="#8E8E93"
            />
            <TextInput
              style={styles.input}
              placeholder="Características (color, tamaño, señas particulares)"
              value={newPost.caracteristicas}
              onChangeText={v => setNewPost(p => ({ ...p, caracteristicas: v }))}
              placeholderTextColor="#8E8E93"
            />
            <TextInput
              style={styles.input}
              placeholder="Domicilio (colonia, calle, referencia)"
              value={newPost.domicilio}
              onChangeText={v => setNewPost(p => ({ ...p, domicilio: v }))}
              placeholderTextColor="#8E8E93"
            />
            <TextInput
              style={styles.input}
              placeholder="Último lugar visto"
              value={newPost.ultimoLugar}
              onChangeText={v => setNewPost(p => ({ ...p, ultimoLugar: v }))}
              placeholderTextColor="#8E8E93"
            />
            <TextInput
              style={styles.input}
              placeholder="Teléfono de contacto"
              keyboardType="phone-pad"
              value={newPost.telefono}
              onChangeText={v => setNewPost(p => ({ ...p, telefono: v }))}
              placeholderTextColor="#8E8E93"
            />
            <TextInput
              style={styles.input}
              placeholder="Recompensa (opcional)"
              keyboardType="numeric"
              value={newPost.recompensa}
              onChangeText={v => setNewPost(p => ({ ...p, recompensa: v }))}
              placeholderTextColor="#8E8E93"
            />
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <TouchableOpacity style={[styles.chip, newPost.estado === 'Perdido' && styles.chipActive]} onPress={() => setNewPost(p => ({ ...p, estado: 'Perdido' }))}>
                <Text style={[styles.chipText, newPost.estado === 'Perdido' && styles.chipTextActive]}>Perdido</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.chip, newPost.estado === 'Visto' && styles.chipActive]} onPress={() => setNewPost(p => ({ ...p, estado: 'Visto' }))}>
                <Text style={[styles.chipText, newPost.estado === 'Visto' && styles.chipTextActive]}>Visto</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.chip, newPost.estado === 'Encontrado' && styles.chipActive]} onPress={() => setNewPost(p => ({ ...p, estado: 'Encontrado' }))}>
                <Text style={[styles.chipText, newPost.estado === 'Encontrado' && styles.chipTextActive]}>Encontrado</Text>
              </TouchableOpacity>
            </View>
            {newPost.imageUrl ? (
              <Image source={{ uri: newPost.imageUrl }} style={{ width: '100%', height: 160, borderRadius: 8, marginBottom: 8 }} />
            ) : null}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={styles.buttonSecondary} onPress={pickImage}>
                <Text style={styles.buttonSecondaryText}>Elegir foto</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buttonSecondary} onPress={() => setNewPost(p => ({ ...p, imageUrl: '' }))}>
                <Text style={styles.buttonSecondaryText}>Quitar foto</Text>
              </TouchableOpacity>
            </View>
            {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
            <TouchableOpacity style={styles.button} activeOpacity={0.8} onPress={addPost}>
              <Text style={styles.buttonText}>Publicar reporte</Text>
            </TouchableOpacity>
          </View>
          )}

          <View style={[styles.card, { width: '88%' }]}>
            <Text style={styles.title}>Reportes recientes</Text>
            <View style={{ marginBottom: 12 }}>
              <TextInput
                style={styles.input}
                placeholder="Buscar por nombre o características"
                value={query}
                onChangeText={setQuery}
                placeholderTextColor="#8E8E93"
              />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {['Todos','Gato','Perro'].map(t => (
                  <TouchableOpacity key={t} style={[styles.chip, (filterType===t)&&styles.chipActive]} onPress={() => { setFilterType(t); }}>
                    <Text style={[styles.chipText, (filterType===t)&&styles.chipTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.chip} onPress={() => setSortBy(s => s==='recientes'?'nombre':s==='nombre'?'antiguos':'recientes')}>
                  <Text style={styles.chipText}>Orden: {sortBy}</Text>
                </TouchableOpacity>
              </View>
            </View>
            <FlatList
              data={[...posts]
                .filter(p => filterType==='Todos' ? true : p.tipo===filterType)
                .filter(p => !query.trim() ? true : (p.nombre+' '+p.caracteristicas).toLowerCase().includes(query.trim().toLowerCase()))
                .sort((a,b) => sortBy==='recientes' ? new Date(b.fecha)-new Date(a.fecha) : sortBy==='antiguos' ? new Date(a.fecha)-new Date(b.fecha) : a.nombre.localeCompare(b.nombre))}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Animated.View style={[styles.postCard, { opacity: introFade, transform: [{ translateY: introFade.interpolate({ inputRange:[0,1], outputRange:[12,0] }) }] }]}>
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 160, borderRadius: 8, marginBottom: 8 }} resizeMode="cover" />
                  ) : null}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={styles.postTitle}>{item.tipo} · {item.nombre}</Text>
                    <Text style={styles.postDate}>{new Date(item.fecha).toLocaleDateString()}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
                    <View style={[styles.chip, { backgroundColor: 'transparent', borderColor: '#2D2D2D' }]}>
                      <Text style={styles.chipText}>{item.estado}</Text>
                    </View>
                    {!!item.recompensa && (
                      <View style={[styles.chip, { backgroundColor: 'transparent', borderColor: '#2D2D2D' }]}>
                        <Text style={styles.chipText}>Recompensa: ${item.recompensa}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.postLabel}>Características</Text>
                  <Text style={styles.postText}>{item.caracteristicas}</Text>
                  <Text style={styles.postLabel}>Domicilio</Text>
                  <Text style={styles.postText}>{item.domicilio}</Text>
                  {!!item.colonia && (
                    <>
                      <Text style={styles.postLabel}>Colonia</Text>
                      <Text style={styles.postText}>{item.colonia}</Text>
                    </>
                  )}
                  <Text style={styles.postLabel}>Último lugar visto</Text>
                  <Text style={styles.postText}>{item.ultimoLugar || 'Sin datos'}</Text>
                  {!!item.ultimaHora && (
                    <>
                      <Text style={styles.postLabel}>Hora</Text>
                      <Text style={styles.postText}>{item.ultimaHora}</Text>
                    </>
                  )}
                  {!!item.raza && (
                    <>
                      <Text style={styles.postLabel}>Raza</Text>
                      <Text style={styles.postText}>{item.raza}</Text>
                    </>
                  )}
                  {!!item.color && (
                    <>
                      <Text style={styles.postLabel}>Color</Text>
                      <Text style={styles.postText}>{item.color}</Text>
                    </>
                  )}
                  {!!item.sexo && (
                    <>
                      <Text style={styles.postLabel}>Sexo</Text>
                      <Text style={styles.postText}>{item.sexo}</Text>
                    </>
                  )}
                  <Text style={styles.postLabel}>Teléfono</Text>
                  <Text style={styles.postPhone}>{item.telefono}</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    <TouchableOpacity style={styles.buttonSecondary} onPress={() => contactPostAuthor(item.id)}>
                      <Text style={styles.buttonSecondaryText}>Contactar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.buttonSecondary} onPress={() => setSelectedPost(item)}>
                      <Text style={styles.buttonSecondaryText}>Ver detalles</Text>
                    </TouchableOpacity>
                  </View>
                  {contactingPostId === item.id && (
                    <View style={{ marginTop: 8 }}>
                      <TextInput
                        style={styles.input}
                        placeholder="Escribe tu mensaje al autor"
                        value={contactMessageText}
                        onChangeText={setContactMessageText}
                        placeholderTextColor="#8E8E93"
                      />
                      <TouchableOpacity style={styles.button} onPress={() => sendContactMessage(item)} activeOpacity={0.8}>
                        <Text style={styles.buttonText}>Enviar mensaje</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </Animated.View>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
              scrollEnabled={false}
            />
          </View>
        </ScrollView>
      ) : activeTab === 'difusion' ? (
        <ScrollView style={{ width: '100%' }} contentContainerStyle={{ alignItems: 'center' }}>
          <View style={[styles.card, { width: '88%' }]}>
            <Text style={styles.title}>Difusión geolocalizada</Text>
            <Text style={{ color: '#E5E7EB', marginBottom: 8, textAlign: 'center' }}>
              Sube datos, previsualiza tu anuncio y activa un plan. Inspirado en servicios como Wako.
            </Text>
            {campaignStep === 1 && (
              <>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, justifyContent: 'center' }}>
                  <TouchableOpacity style={[styles.chip, campaign.tipo === 'Gato' && styles.chipActive]} onPress={() => setCampaign(p => ({ ...p, tipo: 'Gato' }))}>
                    <Text style={[styles.chipText, campaign.tipo === 'Gato' && styles.chipTextActive]}>Gato</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.chip, campaign.tipo === 'Perro' && styles.chipActive]} onPress={() => setCampaign(p => ({ ...p, tipo: 'Perro' }))}>
                    <Text style={[styles.chipText, campaign.tipo === 'Perro' && styles.chipTextActive]}>Perro</Text>
                  </TouchableOpacity>
                </View>
                <TextInput style={styles.input} placeholder="Nombre de la mascota" placeholderTextColor="#8E8E93" value={campaign.nombre} onChangeText={v => setCampaign(p => ({ ...p, nombre: v }))} />
                <TextInput style={styles.input} placeholder="Colonia (zona principal)" placeholderTextColor="#8E8E93" value={campaign.colonia} onChangeText={v => setCampaign(p => ({ ...p, colonia: v }))} />
                <TextInput style={styles.input} placeholder="Zona/Referencia (opcional)" placeholderTextColor="#8E8E93" value={campaign.zona} onChangeText={v => setCampaign(p => ({ ...p, zona: v }))} />
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                  {['2','3','5'].map(km => (
                    <TouchableOpacity key={km} style={[styles.chip, campaign.radioKm === km && styles.chipActive]} onPress={() => setCampaign(p => ({ ...p, radioKm: km }))}>
                      <Text style={[styles.chipText, campaign.radioKm === km && styles.chipTextActive]}>{km} km</Text>
                    </TouchableOpacity>
                  ))}
                  <TextInput
                    style={[styles.input, { width: 100 }]}
                    placeholder="Radio km"
                    placeholderTextColor="#8E8E93"
                    keyboardType="numeric"
                    value={campaign.radioKm}
                    onChangeText={v => setCampaign(p => ({ ...p, radioKm: v.replace(/[^0-9]/g,'') }))}
                  />
                </View>
                <TextInput style={styles.input} placeholder="Teléfono / WhatsApp" placeholderTextColor="#8E8E93" keyboardType="phone-pad" value={campaign.telefono} onChangeText={v => setCampaign(p => ({ ...p, telefono: v }))} />
                {campaign.imageUrl ? (
                  <Image source={{ uri: campaign.imageUrl }} style={{ width: '100%', height: 160, borderRadius: 8, marginBottom: 8 }} />
                ) : null}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity style={styles.buttonSecondary} onPress={pickCampaignImage}>
                    <Text style={styles.buttonSecondaryText}>Elegir foto</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.buttonSecondary} onPress={() => setCampaign(p => ({ ...p, imageUrl: '' }))}>
                    <Text style={styles.buttonSecondaryText}>Quitar foto</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={[styles.input, { height: 100 }]}
                  placeholder="Texto del anuncio (opcional: se autogenera)"
                  placeholderTextColor="#8E8E93"
                  multiline
                  value={campaign.texto}
                  onChangeText={v => setCampaign(p => ({ ...p, texto: v }))}
                />
                <TouchableOpacity
                  style={[styles.button, { marginTop: 8 }]}
                  onPress={() => {
                    if (!isAuthenticated) {
                      setShowAuthPanel(true);
                      setErrorMessage('Debes iniciar sesión para continuar.');
                      return;
                    }
                    if (!campaign.nombre.trim() || !(campaign.colonia.trim() || campaign.zona.trim()) || !campaign.telefono.trim()) {
                      setErrorMessage('Completa nombre, zona/colonia y teléfono.');
                      return;
                    }
                    setErrorMessage('');
                    setCampaignStep(2);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buttonText}>Previsualizar</Text>
                </TouchableOpacity>
              </>
            )}
            {campaignStep === 2 && (
              <>
                <View style={styles.postCard}>
                  <Text style={[styles.postDate, { marginBottom: 6 }]}>Patrocinado · {campaign.colonia || campaign.zona} · ~{campaign.radioKm} km</Text>
                  {campaign.imageUrl ? (
                    <Image source={{ uri: campaign.imageUrl }} style={{ width: '100%', height: 160, borderRadius: 8, marginBottom: 8 }} />
                  ) : null}
                  <Text style={styles.postTitle}>AYUDA A ENCONTRAR A {campaign.nombre?.toUpperCase() || 'TU MASCOTA'}</Text>
                  <Text style={styles.postText}>{campaign.texto?.trim() || autoTextForCampaign(campaign)}</Text>
                  <Text style={[styles.postLabel, { marginTop: 8 }]}>Contacto</Text>
                  <Text style={styles.postPhone}>{campaign.telefono || '—'}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  <TouchableOpacity style={styles.buttonSecondary} onPress={() => setCampaignStep(1)}>
                    <Text style={styles.buttonSecondaryText}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.buttonSecondary} onPress={shareCampaign}>
                    <Text style={styles.buttonSecondaryText}>Compartir</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.buttonSecondary} onPress={contactExpertWhatsApp}>
                    <Text style={styles.buttonSecondaryText}>WhatsApp experto</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.button} onPress={() => setCampaignStep(3)} activeOpacity={0.8}>
                  <Text style={styles.buttonText}>Elegir plan</Text>
                </TouchableOpacity>
              </>
            )}
            {campaignStep === 3 && (
              <>
                <Text style={{ color: '#E5E7EB', marginBottom: 8, textAlign: 'center' }}>
                  Selecciona un plan y activa la difusión. El pago será simulado.
                </Text>
                <View style={{ gap: 8 }}>
                  <TouchableOpacity onPress={() => setSelectedPlan('Lassie')} style={[styles.postCard, selectedPlan==='Lassie' && { borderColor: '#D4AF37' }]}>
                    <Text style={styles.postTitle}>Plan Lassie · USD 35 · 4 días</Text>
                    <Text style={styles.postText}>Stories FB/IG · Geolocalización precisa · 8.5k–18.5k personas</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setSelectedPlan('Garfield')} style={[styles.postCard, selectedPlan==='Garfield' && { borderColor: '#D4AF37' }]}>
                    <Text style={styles.postTitle}>Plan Garfield · USD 55 · 8 días</Text>
                    <Text style={styles.postText}>Incluye Reels · Mayor alcance · 68.5k–82.5k personas</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setSelectedPlan('Beethoven')} style={[styles.postCard, selectedPlan==='Beethoven' && { borderColor: '#D4AF37' }]}>
                    <Text style={styles.postTitle}>Plan Beethoven · USD 95 · 15 días</Text>
                    <Text style={styles.postText}>Máxima exposición · 120.5k–212.5k personas</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  <TouchableOpacity style={styles.buttonSecondary} onPress={() => setCampaignStep(2)}>
                    <Text style={styles.buttonSecondaryText}>Atrás</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.buttonSecondary} onPress={contactExpertWhatsApp}>
                    <Text style={styles.buttonSecondaryText}>Hablar con experto</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.button} onPress={confirmCampaignPayment} activeOpacity={0.8}>
                  <Text style={styles.buttonText}>Pagar y activar (simulación)</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          {!!activeCampaigns.length && (
            <View style={[styles.card, { width: '88%' }]}>
              <Text style={styles.title}>Campañas activas</Text>
              <FlatList
                data={activeCampaigns}
                keyExtractor={(c) => c.id}
                renderItem={({ item }) => (
                  <View style={styles.postCard}>
                    <Text style={styles.postTitle}>{item.plan} · {item.tipo} · {item.nombre}</Text>
                    <Text style={styles.postText}>Zona: {item.colonia || item.zona} · ~{item.radioKm} km</Text>
                    <Text style={styles.postText}>Alcance estimado: {item.alcanceEstimado} · Duración: {item.dias} días</Text>
                    <Text style={styles.postDate}>Desde: {new Date(item.fecha).toLocaleString()}</Text>
                  </View>
                )}
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              />
            </View>
          )}
        </ScrollView>
      ) : activeTab === 'exitos' ? (
        <ScrollView style={{ width: '100%' }} contentContainerStyle={{ alignItems: 'center' }}>
          <View style={[styles.card, { width: '88%' }]}>
            <Text style={styles.title}>Reencuentros recientes</Text>
            {[
              { nombre: 'Linda', texto: '2 vecinos me contactaron después de ver el anuncio. Linda estaba a 12 cuadras.', ciudad: 'Ashburn' },
              { nombre: 'Hipo', texto: '23 llamadas de personas que vieron a Hipo. Lo encontré a 8 cuadras.', ciudad: 'Sin ciudad' },
              { nombre: 'Toby', texto: 'Una vecina vio el anuncio en Instagram y me contactó al instante.', ciudad: 'Ashburn' },
            ].map((s, i) => (
              <Animated.View key={i} style={[styles.postCard, { marginBottom: 8, transform: [{ translateY: introFade.interpolate({ inputRange: [0,1], outputRange: [8,0] }) }] }]}>
                <Text style={styles.postTitle}>¡{s.nombre} de vuelta en casa!</Text>
                <Text style={styles.postText}>{s.texto}</Text>
                <Text style={styles.postDate}>{s.ciudad}</Text>
              </Animated.View>
            ))}
          </View>
        </ScrollView>
      ) : activeTab === 'guia' ? (
        <ScrollView style={{ width: '100%' }} contentContainerStyle={{ alignItems: 'center' }}>
          <View style={[styles.card, { width: '88%' }]}>
            <Text style={styles.title}>Qué hacer si tu mascota se extravía</Text>
            <View style={styles.grid}>
              {[
                { icon: 'search', title: 'Busca cerca', text: 'Recorre 5–10 cuadras y pregunta a vecinos' },
                { icon: 'megaphone-outline', title: 'Volantea', text: 'Imprime 10–20 volantes con foto clara' },
                { icon: 'home-outline', title: 'Refugios', text: 'Llama a refugios y veterinarias cercanas' },
                { icon: 'share-social-outline', title: 'Comparte', text: 'Publica en grupos locales y WhatsApp' },
                { icon: 'navigate-outline', title: 'Último punto', text: 'Anota calle y esquina exactas del avistaje' },
                { icon: 'camera-outline', title: 'Cámaras', text: 'Pregunta por cámaras de negocios cercanos' },
              ].map((s, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.cardSmall,
                    {
                      transform: [
                        { translateY: introFade.interpolate({ inputRange: [0, 1], outputRange: [10 + i % 3 * 4, 0] }) },
                        { scale: introFade.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) },
                      ],
                      opacity: introFade,
                    },
                  ]}
                >
                  <View style={styles.iconCircle}>
                    <Ionicons name={s.icon} size={18} color="#0B0B0B" />
                  </View>
                  <Text style={{ color: '#F8FAFC', fontWeight: '700', marginBottom: 4 }}>{s.title}</Text>
                  <Text style={{ color: '#9CA3AF', fontSize: 12 }}>{s.text}</Text>
                </Animated.View>
              ))}
            </View>
            <View style={{ marginTop: 12 }}>
              <Text style={{ color: '#D4AF37', fontWeight: '700', marginBottom: 6 }}>Checklist 24h críticas</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {['Foto reciente', 'Teléfono activo', 'Último lugar', 'Volantes', 'Difusión', 'Refugios'].map((t) => (
                  <View key={t} style={[styles.chip, { backgroundColor: '#161616', borderColor: '#2D2D2D' }]}>
                    <Text style={styles.chipText}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      ) : activeTab === 'ayuda' ? (
        <ScrollView style={{ width: '100%' }} contentContainerStyle={{ alignItems: 'center' }}>
          <View style={[styles.card, { width: '88%' }]}>
            <Text style={styles.title}>Preguntas frecuentes</Text>
            {[
              { q: '¿Cómo funciona la difusión?', a: 'Creamos un anuncio con tus datos y lo compartes. Puedes activar un plan con alcance estimado por días.' },
              { q: '¿Cuánto tarda en activarse?', a: 'El flujo toma 2–3 minutos. La activación simulada es inmediata.' },
              { q: '¿Puedo editar la zona?', a: 'Sí, ajusta colonia y radio antes de activar; también puedes volver a editar en el Paso 2.' },
              { q: '¿Es obligatorio pagar?', a: 'No. Puedes compartir gratis. El plan solo potencia el alcance geolocalizado.' },
              { q: '¿Cómo contacto a un experto?', a: 'Desde la previsualización, toca “WhatsApp experto” para asesoría.' },
            ].map((f, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setFaqOpen(p => ({ ...p, [idx]: !p[idx] }));
                }}
                style={[styles.accordion, { marginTop: idx === 0 ? 0 : 8 }]}
                activeOpacity={0.85}
              >
                <View style={styles.accordionHeader}>
                  <Text style={styles.messageAuthor}>{f.q}</Text>
                  <Animated.View style={{ transform: [{ rotate: (faqOpen[idx] ? '90deg' : '0deg') }] }}>
                    <Ionicons name="chevron-forward" color="#F8FAFC" size={18} />
                  </Animated.View>
                </View>
                {faqOpen[idx] ? <Text style={styles.messageText}>{f.a}</Text> : null}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      ) : null}
      {!isAuthenticated && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => { switchTo('login'); setShowAuthPanel(true); }}
          activeOpacity={0.85}
        >
          <Text style={{ color: '#0B0B0B', fontWeight: '800' }}>Acceder</Text>
        </TouchableOpacity>
      )}
      {/* Modal de detalles de reporte */}
      <Modal visible={!!selectedPost} transparent animationType="fade" onRequestClose={() => setSelectedPost(null)}>
        <View style={{ flex:1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems:'center', justifyContent:'center', padding:16 }}>
          <View style={[styles.card, { width: '95%', maxWidth: 520 }]}>
            {selectedPost?.imageUrl ? (
              <Image source={{ uri: selectedPost.imageUrl }} style={{ width: '100%', height: 200, borderRadius: 8, marginBottom: 8 }} resizeMode="cover" />
            ) : null}
            <Text style={styles.title}>{selectedPost?.tipo} · {selectedPost?.nombre}</Text>
            <Text style={styles.postLabel}>Características</Text>
            <Text style={styles.postText}>{selectedPost?.caracteristicas}</Text>
            <Text style={styles.postLabel}>Domicilio</Text>
            <Text style={styles.postText}>{selectedPost?.domicilio}</Text>
            <Text style={styles.postLabel}>Último lugar visto</Text>
            <Text style={styles.postText}>{selectedPost?.ultimoLugar || 'Sin datos'}</Text>
            {!!selectedPost?.recompensa && (
              <>
                <Text style={styles.postLabel}>Recompensa</Text>
                <Text style={styles.postText}>${selectedPost?.recompensa}</Text>
              </>
            )}
            <Text style={styles.postLabel}>Teléfono</Text>
            <Text style={styles.postPhone}>{selectedPost?.telefono}</Text>
            <TouchableOpacity style={[styles.button, { marginTop: 12 }]} onPress={() => setSelectedPost(null)}>
              <Text style={styles.buttonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Modal de autenticación */}
      <Modal visible={!!showAuthPanel} transparent animationType="slide" onRequestClose={() => setShowAuthPanel(false)}>
        <View style={{ flex:1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent:'flex-end' }}>
          <View style={[styles.card, { borderTopLeftRadius: 16, borderTopRightRadius: 16 }]}>
            <Text style={styles.title}>{isSignup ? 'Crear cuenta' : 'Inicia sesión'}</Text>
            {isSignup && (
              <TextInput
                style={styles.input}
                placeholder="Nombre"
                value={name}
                onChangeText={setName}
                placeholderTextColor="#8E8E93"
                editable={!isLoading}
              />
            )}
            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              placeholderTextColor="#8E8E93"
              editable={!isLoading}
            />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              placeholderTextColor="#8E8E93"
              editable={!isLoading}
            />
            {isSignup && (
              <TextInput
                style={styles.input}
                placeholder="Confirmar contraseña"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholderTextColor="#8E8E93"
                editable={!isLoading}
              />
            )}
            {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
            {isSignup ? (
              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={async () => { await handleSignup(); if (!errorMessage) setShowAuthPanel(false); }}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Crear cuenta</Text>}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={async () => { await handleLogin(); if (!errorMessage) setShowAuthPanel(false); }}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Entrar</Text>}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => switchTo(isSignup ? 'login' : 'signup')}
              style={{ marginTop: 12, alignSelf: 'center' }}
              activeOpacity={0.7}
            >
              <Text style={{ color: '#D4AF37' }}>
                {isSignup ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Crea una'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ alignSelf: 'center', marginTop: 12 }} onPress={() => setShowAuthPanel(false)}>
              <Text style={{ color: '#9CA3AF' }}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0B',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  topbar: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomColor: '#2D2D2D',
    borderBottomWidth: 1,
  },
  brand: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D4AF37',
  },
  tabs: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#000',
    borderBottomColor: '#2D2D2D',
    borderBottomWidth: 1,
    position: 'relative',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    color: '#9CA3AF',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#F8FAFC',
  },
  tabsIndicator: {
    position: 'absolute',
    height: 3,
    bottom: 0,
    left: 0,
    backgroundColor: '#D4AF37',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  card: {
    width: '88%',
    maxWidth: 420,
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    color: '#F8FAFC',
    textAlign: 'center',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#2D2D2D',
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: '#0F0F10',
    color: '#F8FAFC',
    marginBottom: 12,
  },
  button: {
    height: 48,
    backgroundColor: '#D4AF37',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#0B0B0B',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: '#DC2626',
    marginBottom: 8,
  },
  successText: {
    color: '#D4AF37',
    textAlign: 'center',
  },
  buttonSecondary: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  buttonSecondaryText: {
    color: '#D4AF37',
    fontWeight: '700',
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#2D2D2D',
    borderRadius: 999,
    backgroundColor: '#111111',
  },
  chipActive: {
    borderColor: '#D4AF37',
    backgroundColor: '#161616',
  },
  chipText: {
    color: '#9CA3AF',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#D4AF37',
  },
  postCard: {
    borderWidth: 1,
    borderColor: '#2D2D2D',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#111111',
    marginBottom: 8,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  postDate: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  postLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  postText: {
    color: '#E5E7EB',
  },
  postPhone: {
    color: '#D4AF37',
    fontWeight: '700',
  },
  messageRow: {
    borderWidth: 1,
    borderColor: '#2D2D2D',
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#0F0F10',
  },
  messageAuthor: {
    fontWeight: '700',
    marginBottom: 2,
    color: '#F8FAFC',
  },
  messageText: {
    color: '#E5E7EB',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    height: 48,
    paddingHorizontal: 18,
    backgroundColor: '#D4AF37',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardSmall: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#2D2D2D',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#0F0F10',
    marginBottom: 8,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  accordion: {
    borderWidth: 1,
    borderColor: '#2D2D2D',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#0F0F10',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
});
