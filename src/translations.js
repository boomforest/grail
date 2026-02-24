export const translations = {
  en: {
    // Dashboard
    dashboard: {
      palomas: 'Palomas',
      tickets: 'Tickets',
      cupGame: 'Cup Game',
      settings: 'Settings',
      logout: 'Logout',
      transactionHistory: 'Transaction History',
      sendPalomas: 'Send Palomas',
      requestCashout: 'Request Cashout',
      manageProducts: 'Manage Products',
      manageTickets: 'Manage Tickets'
    },
    
    // Palomas Menu
    palomasMenu: {
      title: 'Palomas',
      get: 'Get',
      send: 'Send',
      info: 'Get Palomas with PayPal • Send to community members',
      infoEs: 'Obtén Palomas con PayPal • Envía a miembros de la comunidad'
    },
    
    // Send Palomas
    sendPalomas: {
      title: 'Send Palomas',
      titleSimple: 'Send Palomas',
      recipientPlaceholder: 'Recipient Username',
      amountPlaceholder: 'Amount',
      yourBalance: 'Your balance',
      send: 'Send',
      sending: 'Sending...',
      errors: {
        recipientRequired: 'Please enter a recipient username',
        amountRequired: 'Please enter a valid amount',
        insufficientBalance: 'Insufficient Palomas balance',
        recipientNotFound: 'Recipient not found',
        cannotSendToSelf: 'Cannot send to yourself',
        failedToSend: 'Failed to send Palomas',
        somethingWrong: 'Something went wrong'
      },
      success: 'Palomas sent to',
      supportCasa: 'Send to CUP333 (Casa de Copas) and earn 33% Love bonus!',
      loveBonus: '33% Love bonus for sending',
      receivedBonus: 'You received {amount} Love tokens as bonus!'
    },

    // Doves & Eggs
    dovesEggs: {
      titleDoves: 'Send Doves',
      titleEggs: 'Send Eggs',
      chooseType: 'Choose Send Type',
      doves: 'Doves',
      eggs: 'Eggs',
      dovesDesc: 'Direct payment - full amount delivered immediately',
      eggsDesc: 'Escrow payment - 1 Dov now, remainder when done',
      recipientPlaceholder: 'Recipient Username',
      amountPlaceholder: 'Amount',
      workDescription: 'Work Description',
      workDescriptionPlaceholder: 'What is this payment for?',
      yourBalance: 'Your balance',
      send: 'Send',
      sending: 'Sending...',
      back: 'Back',
      hatchingInfo: '1 Dov hatches immediately, {pending} pending until you mark done',
      errors: {
        recipientRequired: 'Please enter a recipient username',
        amountRequired: 'Please enter a valid amount',
        insufficientBalance: 'Insufficient balance',
        recipientNotFound: 'Recipient not found',
        cannotSendToSelf: 'Cannot send to yourself',
        minimumAmount: 'Minimum amount is 1',
        failedToSend: 'Failed to send',
        failedToRelease: 'Failed to release payment'
      },
      successDoves: 'Sent {amount} Dovs to @{recipient}',
      successEggs: 'Sent {amount} Eggs to @{recipient}. 1 Dov delivered, {pending} pending.',
      hatchingEggs: 'Hatching Eggs',
      completedTransactions: 'Completed Transactions',
      to: 'To',
      from: 'From',
      dovsPending: 'Dovs pending',
      done: 'Done',
      sent: 'Sent {amount} Dov',
      sentPlural: 'Sent {amount} Dovs',
      received: 'Received {amount} Dov',
      receivedPlural: 'Received {amount} Dovs',
      loadingTransactions: 'Loading transactions...',
      noTransactionsYet: 'No transactions yet'
    },
    
    // Request Cashout
    requestCashout: {
      title: 'Request Cashout',
      subtitle: 'Convert your Palomas to cash via PayPal',
      amountLabel: 'Amount of Palomas to cash out:',
      amountPlaceholder: 'Enter amount (minimum 10)',
      emailLabel: 'PayPal email address:',
      emailPlaceholder: 'your.email@example.com',
      calculation: 'Cashout Calculation:',
      tax: 'Tax',
      youReceive: 'You receive',
      cupLevel: 'Cup level',
      requestButton: 'Request Cashout',
      processing: 'Processing...',
      cancel: 'Cancel',
      important: 'Important:',
      disclaimers: [
        'Cashouts may take up to 10 business days to process',
        'Minimum cashout amount is 10 Palomas',
        'Tax rates decrease as you progress through cup levels',
        'Funds will be sent to your PayPal email address',
        'This action cannot be undone once submitted'
      ],
      errors: {
        amountRequired: 'Please enter a valid amount',
        emailRequired: 'Please enter a valid email address',
        insufficientBalance: 'Insufficient Palomas balance',
        minimumAmount: 'Minimum cashout amount is 10 Palomas',
        adminNotFound: 'Admin account not found',
        failed: 'Failed to process cashout request'
      },
      success: "Cashout request submitted! You'll receive ${amount} at {email} within 10 business days. 💰"
    },
    
    // Transaction History
    transactionHistory: {
      title: 'Transaction History',
      back: 'Back',
      noTransactions: 'No Love Sent Yet',
      noTransactionsDesc: 'Your love transactions will appear here',
      columns: {
        date: 'Date',
        from: 'From',
        to: 'To',
        amount: 'Amount',
        balance: 'Balance'
      },
      current: 'Current:',
      you: 'You',
      receipt: 'Love Transaction Receipt',
      transactionNumber: 'Transaction #:',
      type: 'Type',
      loveSent: 'Love Sent',
      loveReceived: 'Love Received',
      otherParty: 'Other Party',
      description: 'Love transaction',
      status: 'Transaction completed successfully',
      thankYou: 'Thank you for supporting Casa de Copas!'
    },

    // Palomas History
    palomasHistory: {
      title: 'Transaction History',
      button: 'Palomas History',
      loading: 'Loading transactions...',
      noTransactions: 'No transactions yet',
      hatchingEggs: 'Hatching Eggs',
      completedTransactions: 'Completed Transactions',
      to: 'To',
      from: 'From',
      dovsPending: 'Dovs pending',
      done: 'Done',
      sent: 'Sent',
      received: 'Received',
      dov: 'Dov',
      dovs: 'Dovs'
    },

    // Store/Power-Ups
    store: {
      studios: 'Studios',
      pros: 'Pros',
      health: 'Health',
      loading: 'Loading...',
      error: 'Failed to load power-ups',
      noOfferings: 'No offerings available yet',
      selected: 'SELECTED'
    },
    
    // Cup Game
    cupGame: {
      title: 'Tarot Cups Journey',
      yourJourney: 'Your Journey',
      currentCard: 'Current Card',
      totalCups: 'Total Cups',
      cupProgress: 'Cup Progress',
      nextCup: 'Next Cup',
      palomasNeeded: 'Palomas needed',
      selectCard: 'Select Your Tarot Card',
      confirm: 'Confirm Selection',
      cancel: 'Cancel',
      transforming: 'Transforming...',
      knightOfGrail: 'Knight of the Grail',
      specialStatus: 'Special Status',
      backToDashboard: 'Back to Dashboard',
      swordsPath: 'Path of Swords',
      cupsPath: 'Path of Cups',
      swordsDesc: 'The journey begins with mastery of thought and action',
      cupsDesc: 'The path of emotion, intuition, and spiritual fulfillment',
      eraOfSwords: 'Era of Swords',
      eraOfCups: 'Era of Cups',
      swordsQuote: 'When Arthur pulled the sword from the stone...',
      swordsDescription: 'A dark era began where man used intellect to defend attacks and gain as much as possible. For centuries, no remedy existed for this endless cycle of extraction and pain.',
      swordsSummary: 'The age of taking. Sword-holders defend what they\'ve seized, trapped in endless cycles of fear and accumulation.',
      cupsQuote: 'Learn the power of unclenching the sword and holding the cup.',
      cupsDescription: 'The game of cups teaches the joy of giving for the sake of giving. Break free from the endless cycle.',
      cupsSummary: 'The cup holders shape tomorrow. Position yourself while the path remains open.',
      guardianRole: 'Guardian of Casa de Copas',
      level: 'Level',
      complete: 'COMPLETE',
      nextTransformation: 'Next Transformation',
      eternalGuardian: 'Eternal Guardian',
      journeyComplete: 'Journey Complete!',
      knightAchieved: 'Knight of Cups Achieved',
      costToReach: 'Cost to reach',
      ready: 'Ready!',
      loveNeeded: 'Love needed',
      transformedTo: 'Transformed to {cardName}!',
      cardMeaning: 'Card Meaning',
      cardMeanings: {
        kingOfSwords: 'Master of intellect and clear judgment',
        queenOfSwords: 'Perceptive truth and mental clarity',
        knightOfSwords: 'Swift action and determination',
        pageOfSwords: 'New ideas and mental agility',
        aceOfCups: 'New emotional beginnings and love',
        twoOfCups: 'Partnership and mutual attraction',
        threeOfCups: 'Celebration and friendship',
        fourOfCups: 'Contemplation and reevaluation',
        fiveOfCups: 'Loss and emotional challenges',
        sixOfCups: 'Nostalgia and childhood memories',
        sevenOfCups: 'Choices and illusions',
        eightOfCups: 'Walking away and seeking deeper meaning',
        nineOfCups: 'Emotional satisfaction and contentment',
        tenOfCups: 'Emotional fulfillment and family harmony',
        pageOfCups: 'Creative opportunities and intuition',
        knightOfCups: 'Romance and following your heart'
      }
    },
    
    // Login
    login: {
      title: 'Casa de Copas',
      subtitle: 'Community Token Exchange',
      email: 'Email',
      password: 'Password',
      signIn: 'Sign In',
      signUp: 'Sign Up',
      forgotPassword: 'Forgot Password?',
      resetPassword: 'Reset Password',
      sendResetLink: 'Send Reset Link',
      backToLogin: 'Back to Login',
      checkEmail: 'Check your email for reset link',
      tokenExchange: 'Token Exchange',
      usernameWillBe: 'Your username will be',
      threeLetters: '3 Letters',
      threeNumbers: '3 Numbers',
      usernameRules: '✓ Letters only (A-Z) • ✓ Numbers only (0-9) • ✓ Exactly 3 of each',
      enterEmail: 'Enter your email address',
      displayNameOptional: 'Display Name (optional)',
      loading: 'Loading...',
      sending: 'Sending...',
      pleaseEnterEmail: 'Please enter your email address',
      resetFailed: 'Reset failed: {error}',
      resetEmailSent: 'Password reset email sent! Check your inbox.',
      errorOccurred: 'An error occurred. Please try again.',
      pleaseFillFields: 'Please fill in all fields.',
      loginFailed: 'Login failed: {error}',
      unexpectedError: 'An unexpected error occurred. Please try again.',
      fillRequiredFields: 'Please fill in all required fields and ensure username is 6 characters.',
      registrationFailed: 'Registration failed: {error}',
      resetPasswordInstructions: 'Enter your email address and we\'ll send you a link to reset your password.',
      errors: {
        invalidCredentials: 'Invalid email or password',
        userNotFound: 'User not found',
        weakPassword: 'Password must be at least 6 characters',
        emailInUse: 'Email already in use',
        networkError: 'Network error. Please try again.'
      },
      iAmArtist: 'I am applying as an artist for the Casa de Copas accelerator program'
    },

    // Artist Intake
    artist: {
      applyTitle: 'Artist Application',
      applySubtitle: 'Apply to join the Casa de Copas artist accelerator program',
      artistName: 'Artist / Project Name',
      artistNamePlaceholder: 'Your artist or project name',
      country: 'Country of Origin',
      selectCountry: 'Select your country',
      otherCountry: 'Specify your country',
      uploadTrack: 'Upload a Track',
      uploadTrackDesc: 'Share a sample of your work (MP3, WAV, M4A - max 20MB)',
      bio: 'Short Bio / Artist Statement',
      bioPlaceholder: 'Tell us about yourself and your artistic vision...',
      socialLinks: 'Portfolio / Social Media Links',
      socialLinksPlaceholder: 'Instagram, SoundCloud, YouTube, website, etc.',
      chooseFile: 'Choose Audio File',
      uploading: 'Uploading...',
      fileSelected: 'File selected',
      readGuidelines: 'Read Program Guidelines & FAQ',
      confirm18Plus: 'I confirm that I am 18 years of age or older.',
      acceptTerms: 'I have read and agree to the Program Conditions. By submitting this track, I confirm I have the rights to share it and agree to the program rules.',
      submit: 'Submit Application',
      submitting: 'Submitting...',
      pendingTitle: 'Application Received',
      pendingMessage: 'Thank you for applying. Applications are reviewed on a rolling basis. We will notify you when a decision has been made.',
      pendingPrepare: 'While you wait, prepare the following in case you are approved:',
      pendingPrepareItems: [
        'A short bio and artist statement',
        'Links to your portfolio or social media',
        'Additional tracks or demos'
      ],
      portalTitle: 'Artist Portal',
      portalWelcome: 'Welcome to the Casa de Copas artist accelerator.',
      portalComingSoon: 'The full Artist Portal is coming soon.',
      submittedOn: 'Submitted',
      settingsTitle: 'Artist Portal',
      settingsStatus: 'Application Status',
      statusPending: 'Pending Review',
      statusApproved: 'Approved',
      statusDraft: 'Draft',
      statusRejected: 'Rejected',
      changeSong: 'Change Song',
      currentSong: 'Current Song',
      noSong: 'No song uploaded',
      uploadPhoto: 'Upload Artist Photo',
      currentPhoto: 'Artist Photo',
      noPhoto: 'No photo uploaded',
      pageStatus: 'Artist Page Status',
      pageComplete: 'Complete',
      pagePending: 'Pending',
      pageIncomplete: 'Incomplete — fill all fields to complete your profile',
      settingsApplyPrompt: 'Join the Casa de Copas artist accelerator program. Apply to showcase your music and connect with the community.',
      settingsApplyButton: 'Apply as Artist',
      errors: {
        nameRequired: 'Please enter your artist or project name',
        countryRequired: 'Please select your country of origin',
        must18Plus: 'You must confirm you are 18 years or older',
        mustAcceptTerms: 'You must accept the program conditions',
        submitFailed: 'Submission failed'
      }
    },

    // Tickets
    tickets: {
      title: 'Event Tickets',
      myTickets: 'My Tickets',
      availableEvents: 'Available Events',
      buyTicket: 'Buy Ticket',
      eventDate: 'Event Date',
      location: 'Location',
      price: 'Price',
      ticketsRemaining: 'Tickets Remaining',
      purchased: 'Purchased',
      upcoming: 'Upcoming',
      past: 'Past Events',
      noTickets: 'No tickets available',
      purchaseSuccess: 'Ticket purchased successfully!'
    },
    
    // Common
    common: {
      close: '×',
      back: 'Back',
      cancel: 'Cancel',
      save: 'Save',
      edit: 'Edit',
      delete: 'Delete',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      palomas: 'Palomas',
      love: 'Love',
      welcome: 'Welcome',
      profile: 'Profile',
      settings: 'Settings',
      help: 'Help',
      about: 'About'
    }
  },
  
  es: {
    // Dashboard
    dashboard: {
      palomas: 'Palomas',
      tickets: 'Boletos',
      cupGame: 'Juego de Copas',
      settings: 'Configuración',
      logout: 'Cerrar Sesión',
      transactionHistory: 'Historial de Transacciones',
      sendPalomas: 'Enviar Palomas',
      requestCashout: 'Solicitar Retiro',
      manageProducts: 'Administrar Productos',
      manageTickets: 'Administrar Boletos'
    },
    
    // Palomas Menu
    palomasMenu: {
      title: 'Palomas',
      get: 'Obtener',
      send: 'Enviar',
      info: 'Obtén Palomas con PayPal • Envía a miembros de la comunidad'
    },
    
    // Send Palomas
    sendPalomas: {
      title: 'Enviar Palomas',
      titleSimple: 'Enviar Palomas',
      recipientPlaceholder: 'Usuario Destinatario',
      amountPlaceholder: 'Cantidad',
      yourBalance: 'Tu saldo',
      send: 'Enviar',
      sending: 'Enviando...',
      errors: {
        recipientRequired: 'Por favor ingresa un nombre de usuario',
        amountRequired: 'Por favor ingresa una cantidad válida',
        insufficientBalance: 'Saldo insuficiente de Palomas',
        recipientNotFound: 'Destinatario no encontrado',
        cannotSendToSelf: 'No puedes enviarte a ti mismo',
        failedToSend: 'Error al enviar Palomas',
        somethingWrong: 'Algo salió mal'
      },
      success: 'Palomas enviadas a',
      supportCasa: '¡Envía a CUP333 (Casa de Copas) y gana 33% de bonificación en Love!',
      loveBonus: '33% de bonificación Love por enviar',
      receivedBonus: '¡Recibiste {amount} tokens de Love como bonificación!'
    },

    // Doves & Eggs
    dovesEggs: {
      titleDoves: 'Enviar Palomas',
      titleEggs: 'Enviar Huevos',
      chooseType: 'Elige Tipo de Envío',
      doves: 'Palomas',
      eggs: 'Huevos',
      dovesDesc: 'Pago directo - cantidad completa entregada inmediatamente',
      eggsDesc: 'Pago en depósito - 1 Paloma ahora, resto cuando termines',
      recipientPlaceholder: 'Usuario Destinatario',
      amountPlaceholder: 'Cantidad',
      workDescription: 'Descripción del Trabajo',
      workDescriptionPlaceholder: '¿Para qué es este pago?',
      yourBalance: 'Tu saldo',
      send: 'Enviar',
      sending: 'Enviando...',
      back: 'Atrás',
      hatchingInfo: '1 Paloma sale inmediatamente, {pending} pendientes hasta que marques completado',
      errors: {
        recipientRequired: 'Por favor ingresa un nombre de usuario',
        amountRequired: 'Por favor ingresa una cantidad válida',
        insufficientBalance: 'Saldo insuficiente',
        recipientNotFound: 'Destinatario no encontrado',
        cannotSendToSelf: 'No puedes enviarte a ti mismo',
        minimumAmount: 'La cantidad mínima es 1',
        failedToSend: 'Error al enviar',
        failedToRelease: 'Error al liberar pago'
      },
      successDoves: 'Enviaste {amount} Palomas a @{recipient}',
      successEggs: 'Enviaste {amount} Huevos a @{recipient}. 1 Paloma entregada, {pending} pendientes.',
      hatchingEggs: 'Huevos Eclosionando',
      completedTransactions: 'Transacciones Completadas',
      to: 'Para',
      from: 'De',
      dovsPending: 'Palomas pendientes',
      done: 'Listo',
      sent: 'Enviaste {amount} Paloma',
      sentPlural: 'Enviaste {amount} Palomas',
      received: 'Recibiste {amount} Paloma',
      receivedPlural: 'Recibiste {amount} Palomas',
      loadingTransactions: 'Cargando transacciones...',
      noTransactionsYet: 'No hay transacciones aún'
    },
    
    // Request Cashout
    requestCashout: {
      title: 'Solicitar Retiro',
      subtitle: 'Convierte tus Palomas en efectivo vía PayPal',
      amountLabel: 'Cantidad de Palomas a retirar:',
      amountPlaceholder: 'Ingresa cantidad (mínimo 10)',
      emailLabel: 'Correo electrónico de PayPal:',
      emailPlaceholder: 'tu.correo@ejemplo.com',
      calculation: 'Cálculo de Retiro:',
      tax: 'Impuesto',
      youReceive: 'Recibirás',
      cupLevel: 'Nivel de copa',
      requestButton: 'Solicitar Retiro',
      processing: 'Procesando...',
      cancel: 'Cancelar',
      important: 'Importante:',
      disclaimers: [
        'Los retiros pueden tardar hasta 10 días hábiles en procesarse',
        'La cantidad mínima de retiro es 10 Palomas',
        'Las tasas de impuestos disminuyen al progresar en los niveles de copa',
        'Los fondos se enviarán a tu correo de PayPal',
        'Esta acción no se puede deshacer una vez enviada'
      ],
      errors: {
        amountRequired: 'Por favor ingresa una cantidad válida',
        emailRequired: 'Por favor ingresa un correo electrónico válido',
        insufficientBalance: 'Saldo insuficiente de Palomas',
        minimumAmount: 'La cantidad mínima de retiro es 10 Palomas',
        adminNotFound: 'Cuenta de administrador no encontrada',
        failed: 'Error al procesar la solicitud de retiro'
      },
      success: '¡Solicitud de retiro enviada! Recibirás ${amount} en {email} dentro de 10 días hábiles. 💰'
    },
    
    // Transaction History
    transactionHistory: {
      title: 'Historial de Transacciones',
      back: 'Atrás',
      noTransactions: 'No se ha Enviado Love Aún',
      noTransactionsDesc: 'Tus transacciones de love aparecerán aquí',
      columns: {
        date: 'Fecha',
        from: 'De',
        to: 'Para',
        amount: 'Cantidad',
        balance: 'Saldo'
      },
      current: 'Actual:',
      you: 'Tú',
      receipt: 'Recibo de Transacción Love',
      transactionNumber: 'Transacción #:',
      type: 'Tipo',
      loveSent: 'Love Enviado',
      loveReceived: 'Love Recibido',
      otherParty: 'Otra Parte',
      description: 'Transacción love',
      status: 'Transacción completada exitosamente',
      thankYou: '¡Gracias por apoyar a Casa de Copas!'
    },

    // Palomas History
    palomasHistory: {
      title: 'Historial de Transacciones',
      button: 'Historial de Palomas',
      loading: 'Cargando transacciones...',
      noTransactions: 'No hay transacciones aún',
      hatchingEggs: 'Huevos Eclosionando',
      completedTransactions: 'Transacciones Completadas',
      to: 'Para',
      from: 'De',
      dovsPending: 'Palomas pendientes',
      done: 'Listo',
      sent: 'Enviado',
      received: 'Recibido',
      dov: 'Paloma',
      dovs: 'Palomas'
    },

    // Store/Power-Ups
    store: {
      studios: 'Estudios',
      pros: 'Profesionales',
      health: 'Salud',
      loading: 'Cargando...',
      error: 'Error al cargar power-ups',
      noOfferings: 'No hay ofertas disponibles aún',
      selected: 'SELECCIONADO'
    },

    // Cup Game
    cupGame: {
      title: 'Viaje de Copas del Tarot',
      yourJourney: 'Tu Viaje',
      currentCard: 'Carta Actual',
      totalCups: 'Copas Totales',
      cupProgress: 'Progreso de Copas',
      nextCup: 'Siguiente Copa',
      palomasNeeded: 'Palomas necesarias',
      selectCard: 'Selecciona Tu Carta del Tarot',
      confirm: 'Confirmar Selección',
      cancel: 'Cancelar',
      transforming: 'Transformando...',
      knightOfGrail: 'Caballero del Grial',
      specialStatus: 'Estado Especial',
      backToDashboard: 'Volver al Tablero',
      swordsPath: 'Camino de Espadas',
      cupsPath: 'Camino de Copas',
      swordsDesc: 'El viaje comienza con el dominio del pensamiento y la acción',
      cupsDesc: 'El camino de la emoción, intuición y realización espiritual',
      eraOfSwords: 'Era de Espadas',
      eraOfCups: 'Era de Copas',
      swordsQuote: 'Cuando Arturo sacó la espada de la piedra...',
      swordsDescription: 'Comenzó una era oscura donde el hombre usó el intelecto para defender ataques y ganar tanto como fuera posible. Durante siglos, no existió remedio para este ciclo interminable de extracción y dolor.',
      swordsSummary: 'La era del tomar. Los portadores de espadas defienden lo que han tomado, atrapados en ciclos interminables de miedo y acumulación.',
      cupsQuote: 'Aprende el poder de soltar la espada y sostener la copa.',
      cupsDescription: 'El juego de copas enseña la alegría de dar por el simple hecho de dar. Libérate del ciclo interminable.',
      cupsSummary: 'Los portadores de copas moldean el mañana. Posiciónate mientras el camino permanece abierto.',
      guardianRole: 'Guardián de Casa de Copas',
      level: 'Nivel',
      complete: 'COMPLETO',
      nextTransformation: 'Próxima Transformación',
      eternalGuardian: 'Guardián Eterno',
      journeyComplete: '¡Viaje Completo!',
      knightAchieved: 'Caballero de Copas Logrado',
      costToReach: 'Costo para alcanzar',
      ready: '¡Listo!',
      loveNeeded: 'Amor necesario',
      transformedTo: '¡Transformado a {cardName}!',
      cardMeaning: 'Significado de la Carta',
      cardMeanings: {
        kingOfSwords: 'Maestro del intelecto y juicio claro',
        queenOfSwords: 'Verdad perceptiva y claridad mental',
        knightOfSwords: 'Acción rápida y determinación',
        pageOfSwords: 'Nuevas ideas y agilidad mental',
        aceOfCups: 'Nuevos comienzos emocionales y amor',
        twoOfCups: 'Asociación y atracción mutua',
        threeOfCups: 'Celebración y amistad',
        fourOfCups: 'Contemplación y reevaluación',
        fiveOfCups: 'Pérdida y desafíos emocionales',
        sixOfCups: 'Nostalgia y recuerdos de infancia',
        sevenOfCups: 'Elecciones e ilusiones',
        eightOfCups: 'Alejarse y buscar un significado más profundo',
        nineOfCups: 'Satisfacción emocional y contentamiento',
        tenOfCups: 'Plenitud emocional y armonía familiar',
        pageOfCups: 'Oportunidades creativas e intuición',
        knightOfCups: 'Romance y seguir tu corazón'
      }
    },
    
    // Login
    login: {
      title: 'Casa de Copas',
      subtitle: 'Intercambio de Tokens Comunitario',
      email: 'Correo Electrónico',
      password: 'Contraseña',
      signIn: 'Iniciar Sesión',
      signUp: 'Registrarse',
      forgotPassword: '¿Olvidaste tu Contraseña?',
      resetPassword: 'Restablecer Contraseña',
      sendResetLink: 'Enviar Enlace de Restablecimiento',
      backToLogin: 'Volver a Iniciar Sesión',
      checkEmail: 'Revisa tu correo para el enlace',
      tokenExchange: 'Intercambio de Tokens',
      usernameWillBe: 'Tu nombre de usuario será',
      threeLetters: '3 Letras',
      threeNumbers: '3 Números',
      usernameRules: '✓ Solo letras (A-Z) • ✓ Solo números (0-9) • ✓ Exactamente 3 de cada uno',
      enterEmail: 'Ingresa tu dirección de correo',
      displayNameOptional: 'Nombre para mostrar (opcional)',
      loading: 'Cargando...',
      sending: 'Enviando...',
      pleaseEnterEmail: 'Por favor ingresa tu dirección de correo',
      resetFailed: 'Restablecimiento falló: {error}',
      resetEmailSent: '¡Correo de restablecimiento enviado! Revisa tu bandeja.',
      errorOccurred: 'Ocurrió un error. Por favor intenta de nuevo.',
      pleaseFillFields: 'Por favor completa todos los campos.',
      loginFailed: 'Inicio de sesión falló: {error}',
      unexpectedError: 'Ocurrió un error inesperado. Por favor intenta de nuevo.',
      fillRequiredFields: 'Por favor completa todos los campos requeridos y asegúrate de que el nombre de usuario tenga 6 caracteres.',
      registrationFailed: 'Registro falló: {error}',
      resetPasswordInstructions: 'Ingresa tu dirección de correo y te enviaremos un enlace para restablecer tu contraseña.',
      errors: {
        invalidCredentials: 'Correo o contraseña inválidos',
        userNotFound: 'Usuario no encontrado',
        weakPassword: 'La contraseña debe tener al menos 6 caracteres',
        emailInUse: 'Correo ya en uso',
        networkError: 'Error de red. Por favor intenta de nuevo.'
      },
      iAmArtist: 'Estoy aplicando como artista al programa acelerador de Casa de Copas'
    },

    // Artist Intake
    artist: {
      applyTitle: 'Solicitud de Artista',
      applySubtitle: 'Aplica para unirte al programa acelerador de artistas de Casa de Copas',
      artistName: 'Nombre del Artista / Proyecto',
      artistNamePlaceholder: 'Tu nombre artístico o de proyecto',
      country: 'País de Origen',
      selectCountry: 'Selecciona tu país',
      otherCountry: 'Especifica tu país',
      uploadTrack: 'Sube una Pista',
      uploadTrackDesc: 'Comparte una muestra de tu trabajo (MP3, WAV, M4A - máx 20MB)',
      bio: 'Biografía Breve / Declaración Artística',
      bioPlaceholder: 'Cuéntanos sobre ti y tu visión artística...',
      socialLinks: 'Portafolio / Redes Sociales',
      socialLinksPlaceholder: 'Instagram, SoundCloud, YouTube, sitio web, etc.',
      chooseFile: 'Elegir Archivo de Audio',
      uploading: 'Subiendo...',
      fileSelected: 'Archivo seleccionado',
      readGuidelines: 'Leer Directrices del Programa y FAQ',
      confirm18Plus: 'Confirmo que tengo 18 años o más.',
      acceptTerms: 'He leído y acepto las Condiciones del Programa. Al enviar esta pista, confirmo que tengo los derechos para compartirla y acepto las reglas del programa.',
      submit: 'Enviar Solicitud',
      submitting: 'Enviando...',
      pendingTitle: 'Solicitud Recibida',
      pendingMessage: 'Gracias por aplicar. Las solicitudes se revisan de forma continua. Te notificaremos cuando se haya tomado una decisión.',
      pendingPrepare: 'Mientras esperas, prepara lo siguiente en caso de ser aprobado:',
      pendingPrepareItems: [
        'Una breve biografía y declaración artística',
        'Enlaces a tu portafolio o redes sociales',
        'Pistas o demos adicionales'
      ],
      portalTitle: 'Portal del Artista',
      portalWelcome: 'Bienvenido al programa acelerador de artistas de Casa de Copas.',
      portalComingSoon: 'El Portal del Artista completo estará disponible pronto.',
      submittedOn: 'Enviado',
      settingsTitle: 'Portal del Artista',
      settingsStatus: 'Estado de Solicitud',
      statusPending: 'En Revisión',
      statusApproved: 'Aprobado',
      statusDraft: 'Borrador',
      statusRejected: 'Rechazado',
      changeSong: 'Cambiar Canción',
      currentSong: 'Canción Actual',
      noSong: 'Sin canción subida',
      uploadPhoto: 'Subir Foto de Artista',
      currentPhoto: 'Foto de Artista',
      noPhoto: 'Sin foto subida',
      pageStatus: 'Estado de Página de Artista',
      pageComplete: 'Completo',
      pagePending: 'Pendiente',
      pageIncomplete: 'Incompleto — completa todos los campos para terminar tu perfil',
      settingsApplyPrompt: 'Únete al programa acelerador de artistas de Casa de Copas. Aplica para mostrar tu música y conectar con la comunidad.',
      settingsApplyButton: 'Aplicar como Artista',
      errors: {
        nameRequired: 'Por favor ingresa tu nombre artístico o de proyecto',
        countryRequired: 'Por favor selecciona tu país de origen',
        must18Plus: 'Debes confirmar que tienes 18 años o más',
        mustAcceptTerms: 'Debes aceptar las condiciones del programa',
        submitFailed: 'La solicitud falló'
      }
    },

    // Tickets
    tickets: {
      title: 'Boletos de Eventos',
      myTickets: 'Mis Boletos',
      availableEvents: 'Eventos Disponibles',
      buyTicket: 'Comprar Boleto',
      eventDate: 'Fecha del Evento',
      location: 'Ubicación',
      price: 'Precio',
      ticketsRemaining: 'Boletos Restantes',
      purchased: 'Comprado',
      upcoming: 'Próximos',
      past: 'Eventos Pasados',
      noTickets: 'No hay boletos disponibles',
      purchaseSuccess: '¡Boleto comprado exitosamente!'
    },
    
    // Common
    common: {
      close: '×',
      back: 'Atrás',
      cancel: 'Cancelar',
      save: 'Guardar',
      edit: 'Editar',
      delete: 'Eliminar',
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      palomas: 'Palomas',
      love: 'Love',
      welcome: 'Bienvenido',
      profile: 'Perfil',
      settings: 'Configuración',
      help: 'Ayuda',
      about: 'Acerca de'
    }
  }
}

// Helper function to get nested translation
export const getTranslation = (lang, path) => {
  const keys = path.split('.')
  let value = translations[lang] || translations['en']
  
  for (const key of keys) {
    value = value[key]
    if (!value) return path // Return key if translation not found
  }
  
  return value
}

// Helper function to get translation with variables
export const getTranslationWithVars = (lang, path, vars = {}) => {
  let text = getTranslation(lang, path)
  
  Object.keys(vars).forEach(key => {
    text = text.replace(`{${key}}`, vars[key])
  })
  
  return text
}