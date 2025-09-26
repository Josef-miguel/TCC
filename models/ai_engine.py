"""
Engine de IA para administração pessoal de viagens
Sistema baseado em regras que pode evoluir para machine learning
"""
import re
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from .ai_models import (
    AISuggestion, AITaskType, AIPriority, AIReminder, 
    AIChatMessage, AIUserProfile, AITravelInsight, AIDataManager
)

@dataclass
class IntentPattern:
    """Padrão para detecção de intenções"""
    pattern: str
    intent: str
    confidence: float
    keywords: List[str]

class TravelAIEngine:
    """Engine principal da IA de viagens"""
    
    def __init__(self, db):
        self.db = db
        self.data_manager = AIDataManager(db)
        
        # Padrões de intenção para chat
        self.intent_patterns = [
            IntentPattern(
                pattern=r"(sugerir|recomendar|indicar).*(destino|viagem|lugar)",
                intent="suggest_destination",
                confidence=0.9,
                keywords=["sugerir", "recomendar", "destino", "viagem", "lugar"]
            ),
            IntentPattern(
                pattern=r"(quando|quais datas|melhor data).*(viajar|ir)",
                intent="suggest_dates",
                confidence=0.8,
                keywords=["quando", "datas", "melhor", "viajar"]
            ),
            IntentPattern(
                pattern=r"(lembrar|lembrete|não esquecer)",
                intent="set_reminder",
                confidence=0.9,
                keywords=["lembrar", "lembrete", "esquecer"]
            ),
            IntentPattern(
                pattern=r"(agenda|compromissos|eventos).*(próximos|futuros)",
                intent="show_schedule",
                confidence=0.8,
                keywords=["agenda", "compromissos", "eventos", "próximos"]
            ),
            IntentPattern(
                pattern=r"(resumo|resumir|mostrar).*(viagens|eventos)",
                intent="show_summary",
                confidence=0.7,
                keywords=["resumo", "resumir", "mostrar", "viagens"]
            ),
            IntentPattern(
                pattern=r"(conflito|problema|sobreposição).*(agenda|datas)",
                intent="check_conflicts",
                confidence=0.8,
                keywords=["conflito", "problema", "sobreposição", "agenda"]
            )
        ]
        
        # Respostas padrão para cada intenção
        self.default_responses = {
            "suggest_destination": "Vou analisar seus favoritos e histórico para sugerir destinos personalizados!",
            "suggest_dates": "Vou verificar sua agenda para encontrar as melhores datas disponíveis.",
            "set_reminder": "Perfeito! Vou configurar um lembrete para você.",
            "show_schedule": "Aqui estão seus próximos compromissos de viagem:",
            "show_summary": "Vou preparar um resumo das suas viagens e eventos.",
            "check_conflicts": "Analisando sua agenda para detectar possíveis conflitos...",
            "unknown": "Desculpe, não entendi completamente. Pode reformular sua pergunta?"
        }
    
    def process_chat_message(self, user_uid: str, message: str) -> AIChatMessage:
        """Processa uma mensagem do chat e retorna resposta"""
        try:
            # Detectar intenção
            intent, confidence = self._detect_intent(message)
            
            # Gerar resposta baseada na intenção
            response = self._generate_response(user_uid, intent, message, confidence)
            
            # Salvar no histórico
            chat_message = AIChatMessage(
                id="",  # Será definido pelo data_manager
                user_uid=user_uid,
                message=message,
                response=response,
                intent=intent,
                confidence=confidence,
                created_at=datetime.utcnow()
            )
            
            message_id = self.data_manager.save_chat_message(chat_message)
            chat_message.id = message_id
            
            return chat_message
            
        except Exception as e:
            print(f"Erro ao processar mensagem do chat: {e}")
            # Retornar resposta de erro
            return AIChatMessage(
                id="",
                user_uid=user_uid,
                message=message,
                response="Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.",
                intent="error",
                confidence=0.0,
                created_at=datetime.utcnow()
            )
    
    def _detect_intent(self, message: str) -> Tuple[str, float]:
        """Detecta a intenção da mensagem do usuário"""
        message_lower = message.lower()
        
        best_intent = "unknown"
        best_confidence = 0.0
        
        for pattern in self.intent_patterns:
            # Verificar regex
            if re.search(pattern.pattern, message_lower):
                confidence = pattern.confidence
                
                # Aumentar confiança se houver palavras-chave
                keyword_matches = sum(1 for keyword in pattern.keywords if keyword in message_lower)
                confidence += (keyword_matches / len(pattern.keywords)) * 0.2
                
                if confidence > best_confidence:
                    best_intent = pattern.intent
                    best_confidence = min(confidence, 1.0)
        
        return best_intent, best_confidence
    
    def _generate_response(self, user_uid: str, intent: str, message: str, confidence: float) -> str:
        """Gera resposta baseada na intenção detectada"""
        if intent == "suggest_destination":
            return self._generate_destination_suggestions(user_uid)
        elif intent == "suggest_dates":
            return self._generate_date_suggestions(user_uid)
        elif intent == "set_reminder":
            return self._process_reminder_request(user_uid, message)
        elif intent == "show_schedule":
            return self._generate_schedule_summary(user_uid)
        elif intent == "show_summary":
            return self._generate_travel_summary(user_uid)
        elif intent == "check_conflicts":
            return self._check_schedule_conflicts(user_uid)
        else:
            return self.default_responses.get(intent, self.default_responses["unknown"])
    
    def _generate_destination_suggestions(self, user_uid: str) -> str:
        """Gera sugestões de destinos baseadas nos favoritos do usuário"""
        try:
            # Buscar favoritos do usuário
            user_doc = self.db.collection('user').document(user_uid).get()
            if not user_doc.exists:
                return "Não consegui acessar seus dados. Verifique se está logado."
            
            user_data = user_doc.to_dict()
            favorite_posts = user_data.get('favoritePosts', [])
            
            if not favorite_posts:
                return "Você ainda não tem destinos favoritos. Explore alguns eventos para que eu possa sugerir lugares similares!"
            
            # Buscar eventos favoritos
            suggestions = []
            for post_id in favorite_posts[:5]:  # Limitar a 5 para performance
                try:
                    event_doc = self.db.collection('events').document(post_id).get()
                    if event_doc.exists:
                        event_data = event_doc.to_dict()
                        suggestions.append({
                            'title': event_doc.get('title', 'Destino'),
                            'destination': event_doc.get('title', 'Destino'),
                            'tags': event_doc.get('tags', [])
                        })
                except:
                    continue
            
            if suggestions:
                # Criar sugestão baseada nos favoritos
                suggestion = AISuggestion(
                    id="",
                    user_uid=user_uid,
                    type=AITaskType.SUGGEST_DESTINATION,
                    title="Destinos Recomendados",
                    description=f"Baseado nos seus {len(suggestions)} favoritos, aqui estão sugestões personalizadas.",
                    priority=AIPriority.MEDIUM,
                    data={"suggestions": suggestions},
                    created_at=datetime.utcnow()
                )
                
                self.data_manager.save_suggestion(suggestion)
                
                return f"Baseado nos seus favoritos, encontrei {len(suggestions)} destinos similares que podem interessar você! Verifique a seção de sugestões para mais detalhes."
            else:
                return "Analisei seus favoritos, mas preciso de mais dados para fazer sugestões personalizadas. Continue explorando eventos!"
                
        except Exception as e:
            print(f"Erro ao gerar sugestões de destino: {e}")
            return "Ocorreu um erro ao analisar seus favoritos. Tente novamente mais tarde."
    
    def _generate_date_suggestions(self, user_uid: str) -> str:
        """Gera sugestões de datas baseadas na agenda do usuário"""
        try:
            # Buscar eventos do usuário
            user_doc = self.db.collection('user').document(user_uid).get()
            if not user_doc.exists:
                return "Não consegui acessar sua agenda."
            
            user_data = user_doc.to_dict()
            joined_events = user_data.get('joinedEvents', [])
            
            if not joined_events:
                return "Você não tem viagens agendadas. Que tal planejar uma nova aventura?"
            
            # Analisar datas ocupadas
            occupied_dates = []
            for event_id in joined_events:
                try:
                    event_doc = self.db.collection('events').document(event_id).get()
                    if event_doc.exists:
                        event_data = event_doc.to_dict()
                        exit_date = event_data.get('exit_date')
                        return_date = event_data.get('return_date')
                        
                        if exit_date and return_date:
                            occupied_dates.append({
                                'start': exit_date,
                                'end': return_date,
                                'title': event_data.get('title', 'Evento')
                            })
                except:
                    continue
            
            if occupied_dates:
                # Encontrar períodos livres
                free_periods = self._find_free_periods(occupied_dates)
                
                if free_periods:
                    suggestion = AISuggestion(
                        id="",
                        user_uid=user_uid,
                        type=AITaskType.SUGGEST_DESTINATION,
                        title="Melhores Datas para Viajar",
                        description="Analisei sua agenda e encontrei períodos livres ideais para novas viagens.",
                        priority=AIPriority.MEDIUM,
                        data={"free_periods": free_periods, "occupied_dates": occupied_dates},
                        created_at=datetime.utcnow()
                    )
                    
                    self.data_manager.save_suggestion(suggestion)
                    
                    return f"Analisei sua agenda e encontrei {len(free_periods)} períodos livres ideais para novas viagens! Verifique as sugestões para mais detalhes."
                else:
                    return "Sua agenda está bem ocupada! Considere planejar viagens com mais antecedência."
            else:
                return "Não consegui analisar suas datas de viagem. Verifique se seus eventos têm datas definidas."
                
        except Exception as e:
            print(f"Erro ao gerar sugestões de data: {e}")
            return "Ocorreu um erro ao analisar sua agenda. Tente novamente mais tarde."
    
    def _find_free_periods(self, occupied_dates: List[Dict]) -> List[Dict]:
        """Encontra períodos livres na agenda"""
        try:
            # Ordenar datas por início
            sorted_dates = sorted(occupied_dates, key=lambda x: x['start'])
            
            free_periods = []
            now = datetime.utcnow()
            
            # Período antes do primeiro evento
            if sorted_dates and sorted_dates[0]['start'] > now + timedelta(days=7):
                free_periods.append({
                    'start': now + timedelta(days=7),
                    'end': sorted_dates[0]['start'] - timedelta(days=1),
                    'duration_days': (sorted_dates[0]['start'] - now - timedelta(days=7)).days
                })
            
            # Períodos entre eventos
            for i in range(len(sorted_dates) - 1):
                current_end = sorted_dates[i]['end']
                next_start = sorted_dates[i + 1]['start']
                
                if next_start > current_end + timedelta(days=3):  # Pelo menos 3 dias livres
                    free_periods.append({
                        'start': current_end + timedelta(days=1),
                        'end': next_start - timedelta(days=1),
                        'duration_days': (next_start - current_end - timedelta(days=1)).days
                    })
            
            # Filtrar apenas períodos com pelo menos 3 dias
            return [period for period in free_periods if period['duration_days'] >= 3]
            
        except Exception as e:
            print(f"Erro ao encontrar períodos livres: {e}")
            return []
    
    def _process_reminder_request(self, user_uid: str, message: str) -> str:
        """Processa solicitação de lembrete"""
        try:
            # Extrair informações do lembrete da mensagem
            # Por enquanto, criar um lembrete genérico
            reminder = AIReminder(
                id="",
                user_uid=user_uid,
                event_id="",  # Será definido quando houver evento específico
                title="Lembrete Personalizado",
                message=f"Lembrete criado: {message}",
                reminder_date=datetime.utcnow() + timedelta(days=1)  # Lembrete para amanhã
            )
            
            self.data_manager.save_reminder(reminder)
            return "Lembrete criado com sucesso! Você receberá uma notificação amanhã."
            
        except Exception as e:
            print(f"Erro ao processar lembrete: {e}")
            return "Ocorreu um erro ao criar o lembrete. Tente novamente."
    
    def _generate_schedule_summary(self, user_uid: str) -> str:
        """Gera resumo da agenda do usuário"""
        try:
            user_doc = self.db.collection('user').document(user_uid).get()
            if not user_doc.exists:
                return "Não consegui acessar sua agenda."
            
            user_data = user_doc.to_dict()
            joined_events = user_data.get('joinedEvents', [])
            
            if not joined_events:
                return "Você não tem viagens agendadas no momento."
            
            # Buscar próximos eventos
            upcoming_events = []
            now = datetime.utcnow()
            
            for event_id in joined_events:
                try:
                    event_doc = self.db.collection('events').document(event_id).get()
                    if event_doc.exists:
                        event_data = event_doc.to_dict()
                        exit_date = event_data.get('exit_date')
                        
                        if exit_date and exit_date > now:
                            upcoming_events.append({
                                'title': event_data.get('title', 'Evento'),
                                'date': exit_date,
                                'days_until': (exit_date - now).days
                            })
                except:
                    continue
            
            if upcoming_events:
                # Ordenar por data
                upcoming_events.sort(key=lambda x: x['date'])
                
                summary = "📅 Seus próximos compromissos de viagem:\n\n"
                for event in upcoming_events[:5]:  # Mostrar apenas os 5 próximos
                    summary += f"• {event['title']} - em {event['days_until']} dias\n"
                
                if len(upcoming_events) > 5:
                    summary += f"\n... e mais {len(upcoming_events) - 5} eventos."
                
                return summary
            else:
                return "Você não tem viagens agendadas para o futuro próximo."
                
        except Exception as e:
            print(f"Erro ao gerar resumo da agenda: {e}")
            return "Ocorreu um erro ao acessar sua agenda. Tente novamente."
    
    def _generate_travel_summary(self, user_uid: str) -> str:
        """Gera resumo geral das viagens do usuário"""
        try:
            user_doc = self.db.collection('user').document(user_uid).get()
            if not user_doc.exists:
                return "Não consegui acessar seus dados de viagem."
            
            user_data = user_doc.to_dict()
            joined_events = user_data.get('joinedEvents', [])
            favorite_posts = user_data.get('favoritePosts', [])
            
            # Estatísticas básicas
            total_trips = len(joined_events)
            total_favorites = len(favorite_posts)
            
            summary = f"📊 Resumo das suas viagens:\n\n"
            summary += f"• Total de viagens: {total_trips}\n"
            summary += f"• Destinos favoritos: {total_favorites}\n"
            
            if total_trips > 0:
                summary += f"\n🎯 Você é um viajante ativo! Continue explorando novos destinos."
            else:
                summary += f"\n🌟 Que tal começar sua primeira aventura? Explore os eventos disponíveis!"
            
            return summary
            
        except Exception as e:
            print(f"Erro ao gerar resumo de viagens: {e}")
            return "Ocorreu um erro ao gerar o resumo. Tente novamente."
    
    def _check_schedule_conflicts(self, user_uid: str) -> str:
        """Verifica conflitos na agenda do usuário"""
        try:
            user_doc = self.db.collection('user').document(user_uid).get()
            if not user_doc.exists:
                return "Não consegui acessar sua agenda."
            
            user_data = user_doc.to_dict()
            joined_events = user_data.get('joinedEvents', [])
            
            if len(joined_events) < 2:
                return "Você não tem eventos suficientes para verificar conflitos."
            
            # Buscar todos os eventos
            events = []
            for event_id in joined_events:
                try:
                    event_doc = self.db.collection('events').document(event_id).get()
                    if event_doc.exists:
                        event_data = event_doc.to_dict()
                        exit_date = event_data.get('exit_date')
                        return_date = event_data.get('return_date')
                        
                        if exit_date and return_date:
                            events.append({
                                'id': event_id,
                                'title': event_data.get('title', 'Evento'),
                                'start': exit_date,
                                'end': return_date
                            })
                except:
                    continue
            
            # Verificar sobreposições
            conflicts = []
            for i in range(len(events)):
                for j in range(i + 1, len(events)):
                    event1 = events[i]
                    event2 = events[j]
                    
                    # Verificar se há sobreposição
                    if (event1['start'] <= event2['end'] and event2['start'] <= event1['end']):
                        conflicts.append({
                            'event1': event1['title'],
                            'event2': event2['title'],
                            'overlap_start': max(event1['start'], event2['start']),
                            'overlap_end': min(event1['end'], event2['end'])
                        })
            
            if conflicts:
                conflict_text = "⚠️ Conflitos detectados na sua agenda:\n\n"
                for conflict in conflicts:
                    conflict_text += f"• {conflict['event1']} e {conflict['event2']}\n"
                
                # Criar sugestão de conflito
                suggestion = AISuggestion(
                    id="",
                    user_uid=user_uid,
                    type=AITaskType.SCHEDULE_CONFLICT,
                    title="Conflitos na Agenda",
                    description=f"Detectados {len(conflicts)} conflitos de datas na sua agenda.",
                    priority=AIPriority.HIGH,
                    data={"conflicts": conflicts},
                    created_at=datetime.utcnow()
                )
                
                self.data_manager.save_suggestion(suggestion)
                
                return conflict_text + "\nVerifique a seção de sugestões para mais detalhes."
            else:
                return "✅ Sua agenda está organizada! Nenhum conflito detectado."
                
        except Exception as e:
            print(f"Erro ao verificar conflitos: {e}")
            return "Ocorreu um erro ao verificar sua agenda. Tente novamente."
    
    def generate_daily_reminders(self, user_uid: str) -> List[AIReminder]:
        """Gera lembretes diários automáticos"""
        try:
            reminders = []
            now = datetime.utcnow()
            
            # Buscar eventos próximos (próximos 7 dias)
            user_doc = self.db.collection('user').document(user_uid).get()
            if not user_doc.exists:
                return reminders
            
            user_data = user_doc.to_dict()
            joined_events = user_data.get('joinedEvents', [])
            
            for event_id in joined_events:
                try:
                    event_doc = self.db.collection('events').document(event_id).get()
                    if event_doc.exists:
                        event_data = event_doc.to_dict()
                        exit_date = event_data.get('exit_date')
                        
                        if exit_date:
                            days_until = (exit_date - now).days
                            
                            # Criar lembretes para 3 dias antes, 1 dia antes e no dia
                            if days_until == 3:
                                reminder = AIReminder(
                                    id="",
                                    user_uid=user_uid,
                                    event_id=event_id,
                                    title="Viagem em 3 dias!",
                                    message=f"Sua viagem '{event_data.get('title', 'Evento')}' começa em 3 dias. Que tal começar a se preparar?",
                                    reminder_date=now
                                )
                                reminders.append(reminder)
                            
                            elif days_until == 1:
                                reminder = AIReminder(
                                    id="",
                                    user_uid=user_uid,
                                    event_id=event_id,
                                    title="Viagem amanhã!",
                                    message=f"Sua viagem '{event_data.get('title', 'Evento')}' começa amanhã! Não esqueça de fazer as malas!",
                                    reminder_date=now
                                )
                                reminders.append(reminder)
                            
                            elif days_until == 0:
                                reminder = AIReminder(
                                    id="",
                                    user_uid=user_uid,
                                    event_id=event_id,
                                    title="Hoje é o dia!",
                                    message=f"Hoje começa sua viagem '{event_data.get('title', 'Evento')}'! Boa viagem! 🎉",
                                    reminder_date=now
                                )
                                reminders.append(reminder)
                
                except Exception as e:
                    print(f"Erro ao processar evento {event_id}: {e}")
                    continue
            
            # Salvar lembretes
            for reminder in reminders:
                self.data_manager.save_reminder(reminder)
            
            return reminders
            
        except Exception as e:
            print(f"Erro ao gerar lembretes diários: {e}")
            return []
    
    def generate_weekly_insights(self, user_uid: str) -> List[AITravelInsight]:
        """Gera insights semanais para o usuário"""
        try:
            insights = []
            
            # Buscar dados do usuário
            user_doc = self.db.collection('user').document(user_uid).get()
            if not user_doc.exists:
                return insights
            
            user_data = user_doc.to_dict()
            joined_events = user_data.get('joinedEvents', [])
            favorite_posts = user_data.get('favoritePosts', [])
            
            # Insight 1: Análise de padrões de viagem
            if len(joined_events) >= 3:
                insight = AITravelInsight(
                    id="",
                    user_uid=user_uid,
                    insight_type="travel_pattern",
                    title="Padrão de Viagens Detectado",
                    description=f"Você já participou de {len(joined_events)} viagens! Analisando seus padrões de preferência...",
                    data={"total_trips": len(joined_events), "favorites": len(favorite_posts)},
                    confidence_score=0.8,
                    created_at=datetime.utcnow()
                )
                insights.append(insight)
            
            # Insight 2: Sugestão de novos destinos
            if len(favorite_posts) >= 2:
                insight = AITravelInsight(
                    id="",
                    user_uid=user_uid,
                    insight_type="destination_expansion",
                    title="Explore Novos Horizontes",
                    description="Baseado nos seus favoritos, você pode gostar de destinos similares. Que tal expandir seus horizontes?",
                    data={"favorite_count": len(favorite_posts)},
                    confidence_score=0.7,
                    created_at=datetime.utcnow()
                )
                insights.append(insight)
            
            # Salvar insights
            for insight in insights:
                self.data_manager.save_insight(insight)
            
            return insights
            
        except Exception as e:
            print(f"Erro ao gerar insights semanais: {e}")
            return []
