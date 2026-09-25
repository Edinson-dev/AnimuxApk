    // ── Saltar al siguiente servidor ──────────────────────
    const tryNextServer = useCallback(() => {
      if (!channel || channel.isVOD || isEmbed) {
        setError(true);
        setLoading(false);
        return;
      }
      
      let urls = [];
      if (typeof channel.url === 'string') {
        urls = channel.url.split(',').map(u => u.trim()).filter(Boolean);
      } else if (Array.isArray(channel.url)) {
        urls = channel.url;
      }
      
      if (serverIndexRef.current < urls.length - 1) {
        console.warn(`🔄 Falló el servidor ${serverIndexRef.current + 1}. Intentando el siguiente...`);
        serverIndexRef.current += 1;
        setServerIndex(serverIndexRef.current);
        const nextUrl = urls[serverIndexRef.current];
        setCurrentUrl(nextUrl ? decodeCamouflage(nextUrl) : '');
      } else {
        console.error('❌ Todos los servidores fallaron.');
        setError(true);
        setLoading(false);
      }
    }, [channel, isEmbed]);

    useEffect(() => {
      const video = videoRef.current;
      if (!video || !currentUrl) return;

      const urlLower = currentUrl.toLowerCase();
      const isExternal = currentUrl.startsWith('http');
      const isProd = import.meta.env.PROD;

      // Detección de tipo de stream
      const isM3U8 = !isPodcast && (
                     urlLower.includes('.m3u8') ||
                     urlLower.includes('jmp2.uk') ||
                     urlLower.includes('.ts') ||
                     urlLower.includes('.m3u') ||
                     (currentUrl.includes('/play/') && 
                      !urlLower.includes('.mp4') && 
                      !urlLower.includes('.mkv') && 
                      !urlLower.includes('.mp3') && 
                      !urlLower.includes('.m4a') && 
                      !urlLower.includes('podcast')) ||
                     (!channel.isVOD && !isEmbed));

      const isDirectMedia = isPodcast || (!isM3U8 && ['.mp4', '.mkv', '.mp3', '.m4a', '.aac', '.ogg', '.wav', '.flac', '.webm'].some(e => urlLower.includes(e)));
      
      // Lógica de Proxy Inteligente:
      // 1. Canales con Referer obligatorio (fubo18, latamvidzfy, vivolatamz)
      // 2. Contenido HTTP en sitio HTTPS (Mixed Content en producción)
      // 3. Flags explícitos de proxy en el canal
      const isSpecialRefererHost = urlLower.includes('fubo18.com') || urlLower.includes('latamvidzfy.org') || urlLower.includes('vivolatamz.org');
      const isMixedContent = isProd && currentUrl.startsWith('http:');
      const needsProxy = isExternal && (
        isSpecialRefererHost || 
        isMixedContent || 
        Boolean(channel?.needsProxy)
      );

      console.log(`🎬 Reproduciendo: ${currentUrl} | Proxy: ${needsProxy} | Tipo: ${isPodcast ? 'Podcast/Audio' : (isM3U8 ? 'HLS' : 'Direct')}`);

      let loadTimeout;
      let monitorInterval;

      // SOLO aplicar timeouts y monitoreo si NO es un embed.
      // Los embeds (Archive.org, Drive, YouTube) no deben lanzar "Enlace Caído" por timeout de video
      if (!isEmbed) {
        // 2. Timeout de conexión inicial (Solo para Live TV con servidores Xtream)
        // Para VOD (Archive.org, Drive, Podcasts) permitimos que el navegador cargue sin límite de tiempo
        if (!channel.isVOD && !isDirectMedia && !isPodcast && channel.streamId) {
          loadTimeout = setTimeout(() => {
            if (video && video.currentTime === 0 && !video.paused) {
              console.warn('⏱ Timeout de conexión (15s). Cambiando servidor...');
              tryNextServer();
            }
          }, 15000);
        }

        // 3. Monitor de congelamiento (Solo para Live TV con servidores Xtream)
        if (!channel.isVOD && !isDirectMedia && !isPodcast && channel.streamId) {
          monitorInterval = setInterval(() => {
            if (video && !video.paused && !video.ended && video.readyState >= 2) {
              if (video.currentTime === freezeRef.current.lastTime) {
                freezeRef.current.counter++;
                if (freezeRef.current.counter >= 6) {
                  console.warn('❄️ Stream congelado 6s. Cambiando servidor...');
                  clearInterval(monitorInterval);
                  tryNextServer();
                }
              } else {
                freezeRef.current = { lastTime: video.currentTime, counter: 0 };
              }
            }
          }, 1000);
        }
      }

      // 4. Reproducción directa (podcasts, audio, mp4, ts, etc.)
      if (isDirectMedia) {
        video.src = needsProxy ? `/api/proxy?url=${encodeURIComponent(currentUrl)}` : currentUrl;
        video.load();
        video.oncanplay = () => { clearTimeout(loadTimeout); setLoading(false); safePlay(); };
        video.onloadeddata = () => { clearTimeout(loadTimeout); setLoading(false); };
        video.onerror = (err) => { 
          clearTimeout(loadTimeout); 
          console.error('❌ Error en reproducción directa:', currentUrl, err);
          // Si falló de forma directa en HTTPS, intentar con el proxy como alternativa antes de rendirse
          if (!needsProxy && isExternal && !currentUrl.startsWith('/api/proxy')) {
            console.warn('🔄 Reintentando audio/video con proxy de respaldo...');
            video.src = `/api/proxy?url=${encodeURIComponent(currentUrl)}`;
            video.load();
            safePlay();
            return;
          }
          if (isPodcast || channel.fromM3U || !channel.streamId) {
            setError(true);
            setLoading(false);
            return;
          }
          tryNextServer(); 
        };

      // 5. Reproducción HLS Pura (Con failover inteligente y reescritura de fragmentos proxy)
      } else if (Hls.isSupported() && isM3U8) {
        
        const manifestUrl = needsProxy 
          ? `/api/proxy?url=${encodeURIComponent(currentUrl)}` 
          : currentUrl;

        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true, // Activado para arranque rápido
          startLevel: -1,       // Empieza en auto (baja resolución) para cargar al instante
          maxBufferLength: 30,  // Reducido de 60 a 30
          maxMaxBufferLength: 60, // Reducido de 120 a 60
          liveSyncDurationCount: 3, // Reducido de 5 a 3
          liveMaxLatencyDurationCount: 10,
          manifestLoadingMaxRetry: 5,
          manifestLoadingRetryDelay: 1000,
          levelLoadingMaxRetry: 5,
          fragLoadingMaxRetry: 8,
          fragLoadingRetryDelay: 500,
          xhrSetup: (xhr, url) => {
            // Si una petición relativa se resolvió localmente contra /api/ debido al proxy, redirigirla al proxy con la URL destino correcta
            if (needsProxy && !url.includes('?url=')) {
              try {
                if (url.startsWith(window.location.origin + '/api/') || url.startsWith('/api/')) {
                  const relativePath = url.replace(window.location.origin, '').replace(/^\/api\//, '');
                  const targetBase = new URL(currentUrl);
                  const resolvedUrl = new URL(relativePath, targetBase).href;
                  xhr.open('GET', `/api/proxy?url=${encodeURIComponent(resolvedUrl)}`, true);
                }
              } catch (e) {
                console.warn('HLS proxy path rewrite fallback:', e);
              }
            }
          }
        });

        hlsRef.current = hls;
        hls.loadSource(manifestUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
          clearTimeout(loadTimeout);
          setLoading(false);
          
          if (data && data.levels) {
             const availableLevels = data.levels.map((l, index) => ({ height: l.height || 'Auto', index }));
             // Filtrar duplicados o niveles sin altura definida
             const uniqueLevels = availableLevels.filter((l, i, self) => l.height && self.findIndex(t => t.height === l.height) === i).sort((a,b) => b.height - a.height);
             setLevels(uniqueLevels);
          }

          // Detect embedded audio tracks
          if (hls.audioTracks && hls.audioTracks.length > 0) {
            setAudioTracks(hls.audioTracks);
            setSelectedAudioTrack(hls.audioTrack);
          }

          // Detect embedded subtitle tracks
          if (hls.subtitleTracks && hls.subtitleTracks.length > 0) {
            setSubtitleTracks(hls.subtitleTracks);
          }
          
          safePlay();
        });

        hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (event, data) => {
          if (data && data.audioTracks) {
            setAudioTracks(data.audioTracks);
            setSelectedAudioTrack(hls.audioTrack);
          }
        });

        hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (event, data) => {
          if (data && typeof data.id === 'number') {
            setSelectedAudioTrack(data.id);
          }
        });

        hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, (event, data) => {
          if (data && data.subtitleTracks) {
            setSubtitleTracks(data.subtitleTracks);
          }
        });
        hls.on(Hls.Events.SUBTITLE_TRACK_SWITCH, (event, data) => {
          if (data && typeof data.id === 'number') {
            if (selectedSubtitleTrack !== 'external') {
              setSelectedSubtitleTrack(data.id);
            }
          }
        });

        let retriedWithProxy = false;
        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              if (!retriedWithProxy && !needsProxy && currentUrl.startsWith('http')) {
                retriedWithProxy = true;
                hls.loadSource(`/api/proxy?url=${encodeURIComponent(currentUrl)}`);
                hls.startLoad();
              } else {
                hls.startLoad();
              }
            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              hls.recoverMediaError();
            } else {
              hls.destroy();
            }
          }
        });
      } else {
        video.src = needsProxy ? `/api/proxy?url=${encodeURIComponent(currentUrl)}` : currentUrl;
        video.load();
        safePlay();
        video.oncanplay = () => { clearTimeout(loadTimeout); setLoading(false); safePlay(); };
        video.onerror = () => { clearTimeout(loadTimeout); tryNextServer(); };
      }

      return () => {
        clearTimeout(loadTimeout);
        clearInterval(monitorInterval);
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
      };
    }, [currentUrl, isEmbed]);

    // ── Progress Saving Effect ──────────────────────────────────────────────
    useEffect(() => {
      const video = videoRef.current;
      if (!video || !channel || !channel.isVOD || isEmbed) return;

      const saveProgress = () => {
        if (video.currentTime > 0 && !video.ended && video.duration > 0) {
          const percent = (video.currentTime / video.duration) * 100;
          if (percent > 95) {
            localStorage.removeItem(`animux_progress_${channel.id}`);
          } else {
            const progressData = {
              time: video.currentTime,
              duration: video.duration,
              percent: percent
            };
            localStorage.setItem(`animux_progress_${channel.id}`, JSON.stringify(progressData));
            
            // Notificar a otros componentes (tarjetas) que el progreso cambió
            window.dispatchEvent(new CustomEvent('animux_progress_updated', { 
              detail: { channelId: channel.id, progress: progressData } 
            }));

            if (channel.groupId) {
              localStorage.setItem(`animux_last_episode_${channel.groupId}`, channel.id);
            }
          }
        }
      };

      const interval = setInterval(saveProgress, 5000);
      return () => {
        saveProgress();
        clearInterval(interval);
      };
    }, [channel, isEmbed]);

    const handleResume = () => {
      if (videoRef.current && savedTime > 0) {
        const video = videoRef.current;
        
        const applyTime = () => {
          video.currentTime = savedTime;
          setShowResumePrompt(false);
          setSavedTime(0);
          video.play().catch(() => {});
        };

        if (video.readyState >= 1) {
          applyTime();
        } else {
          video.addEventListener('loadedmetadata', applyTime, { once: true });
          // Fallback por si ya cargó pero el readyState miente
          setTimeout(applyTime, 1000);
        }
      }
    };

    if (!channel) return null;

    const playerContainerClasses = minimized 
      ? "fixed bottom-24 right-4 w-64 md:w-80 aspect-video z-[150] rounded-3xl overflow-hidden shadow-2xl border-2 border-rose-600/30 animate-slide-up group bg-black"
      : `${isInline ? 'relative h-full w-full' : 'fixed inset-0'} z-[110] flex flex-col bg-black animate-fade-in`;

    return (
