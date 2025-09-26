"""
Modelos de dados para o sistema de IA de administração pessoal de viagens
"""
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict
from enum import Enum
import json

class AITaskType(Enum):
    """Tipos de tarefas que a IA pode executar"""
    SUGGEST_DESTINATION = "suggest_destination"
    REMINDER = "reminder"
    SCHEDULE_CONFLICT = "schedule_conflict"
    DAILY_SUMMARY = "daily_summary"
    WEEKLY_SUMMARY = "weekly_summary"
    TRAVEL_PLANNING = "travel_planning"
    CHAT_RESPONSE = "chat_response"

class AIPriority(Enum):
    """Prioridades para as sugestões da IA"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

@dataclass
class AISuggestion:
    """Modelo para sugestões da IA"""
    id: str
    user_uid: str
    type: AITaskType
    title: str
    description: str
    priority: AIPriority
    data: Dict[str, Any]  # Dados específicos da sugestão
    created_at: datetime
    expires_at: Optional[datetime] = None
    is_read: bool = False
    is_dismissed: bool = False
    action_taken: Optional[str] = None  # Ação que o usuário tomou

    def to_dict(self) -> Dict[str, Any]:
        """Converte para dicionário para salvar no Firestore"""
        data = asdict(self)
        data['type'] = self.type.value
        data['priority'] = self.priority.value
        return data

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'AISuggestion':
        """Cria instância a partir de dicionário do Firestore"""
        data['type'] = AITaskType(data['type'])
        data['priority'] = AIPriority(data['priority'])
        return cls(**data)

@dataclass
class AIReminder:
    """Modelo para lembretes da IA"""
    id: str
    user_uid: str
    event_id: str
    title: str
    message: str
    reminder_date: datetime
    is_sent: bool = False
    created_at: datetime = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'AIReminder':
        return cls(**data)

@dataclass
class AIChatMessage:
    """Modelo para mensagens do chat com IA"""
    id: str
    user_uid: str
    message: str
    response: str
    intent: str  # Intenção detectada (ex: "suggest_destination", "ask_schedule")
    confidence: float  # Confiança na detecção da intenção (0-1)
    created_at: datetime
    is_helpful: Optional[bool] = None  # Feedback do usuário

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'AIChatMessage':
        return cls(**data)

@dataclass
class AIUserProfile:
    """Perfil do usuário para personalização da IA"""
    user_uid: str
    preferred_destinations: List[str]
    travel_preferences: Dict[str, Any]  # Preferências de viagem
    budget_range: Dict[str, float]  # {"min": 0, "max": 1000}
    preferred_dates: List[str]  # Datas preferidas para viajar
    travel_history: List[str]  # IDs de eventos já participados
    ai_learning_data: Dict[str, Any]  # Dados para aprendizado da IA
    last_updated: datetime

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'AIUserProfile':
        return cls(**data)

@dataclass
class AITravelInsight:
    """Insights e análises de viagem gerados pela IA"""
    id: str
    user_uid: str
    insight_type: str  # "destination_trend", "schedule_optimization", "budget_analysis"
    title: str
    description: str
    data: Dict[str, Any]  # Dados específicos do insight
    confidence_score: float  # 0-1
    created_at: datetime
    is_relevant: bool = True

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'AITravelInsight':
        return cls(**data)

class AIDataManager:
    """Gerenciador de dados da IA para operações com Firestore"""
    
    def __init__(self, db):
        self.db = db
    
    def save_suggestion(self, suggestion: AISuggestion) -> str:
        """Salva uma sugestão da IA no Firestore"""
        try:
            doc_ref = self.db.collection('ai_suggestions').document()
            suggestion.id = doc_ref.id
            doc_ref.set(suggestion.to_dict())
            return doc_ref.id
        except Exception as e:
            print(f"Erro ao salvar sugestão: {e}")
            raise
    
    def get_user_suggestions(self, user_uid: str, limit: int = 10) -> List[AISuggestion]:
        """Busca sugestões para um usuário"""
        try:
            suggestions = []
            query = (self.db.collection('ai_suggestions')
                    .where('user_uid', '==', user_uid)
                    .where('is_dismissed', '==', False)
                    .order_by('created_at', direction='DESCENDING')
                    .limit(limit))
            
            for doc in query.stream():
                data = doc.to_dict()
                data['id'] = doc.id
                suggestions.append(AISuggestion.from_dict(data))
            
            return suggestions
        except Exception as e:
            print(f"Erro ao buscar sugestões: {e}")
            return []
    
    def save_reminder(self, reminder: AIReminder) -> str:
        """Salva um lembrete da IA"""
        try:
            doc_ref = self.db.collection('ai_reminders').document()
            reminder.id = doc_ref.id
            doc_ref.set(reminder.to_dict())
            return doc_ref.id
        except Exception as e:
            print(f"Erro ao salvar lembrete: {e}")
            raise
    
    def get_pending_reminders(self, user_uid: str) -> List[AIReminder]:
        """Busca lembretes pendentes para um usuário"""
        try:
            reminders = []
            now = datetime.utcnow()
            query = (self.db.collection('ai_reminders')
                    .where('user_uid', '==', user_uid)
                    .where('is_sent', '==', False)
                    .where('reminder_date', '<=', now))
            
            for doc in query.stream():
                data = doc.to_dict()
                data['id'] = doc.id
                reminders.append(AIReminder.from_dict(data))
            
            return reminders
        except Exception as e:
            print(f"Erro ao buscar lembretes: {e}")
            return []
    
    def save_chat_message(self, message: AIChatMessage) -> str:
        """Salva uma mensagem do chat com IA"""
        try:
            doc_ref = self.db.collection('ai_chat_messages').document()
            message.id = doc_ref.id
            doc_ref.set(message.to_dict())
            return doc_ref.id
        except Exception as e:
            print(f"Erro ao salvar mensagem do chat: {e}")
            raise
    
    def get_user_chat_history(self, user_uid: str, limit: int = 20) -> List[AIChatMessage]:
        """Busca histórico de chat do usuário"""
        try:
            messages = []
            query = (self.db.collection('ai_chat_messages')
                    .where('user_uid', '==', user_uid)
                    .order_by('created_at', direction='DESCENDING')
                    .limit(limit))
            
            for doc in query.stream():
                data = doc.to_dict()
                data['id'] = doc.id
                messages.append(AIChatMessage.from_dict(data))
            
            return messages
        except Exception as e:
            print(f"Erro ao buscar histórico do chat: {e}")
            return []
    
    def get_or_create_user_profile(self, user_uid: str) -> AIUserProfile:
        """Busca ou cria perfil do usuário para IA"""
        try:
            doc_ref = self.db.collection('ai_user_profiles').document(user_uid)
            doc = doc_ref.get()
            
            if doc.exists:
                data = doc.to_dict()
                return AIUserProfile.from_dict(data)
            else:
                # Criar perfil padrão
                profile = AIUserProfile(
                    user_uid=user_uid,
                    preferred_destinations=[],
                    travel_preferences={},
                    budget_range={"min": 0, "max": 1000},
                    preferred_dates=[],
                    travel_history=[],
                    ai_learning_data={},
                    last_updated=datetime.utcnow()
                )
                doc_ref.set(profile.to_dict())
                return profile
        except Exception as e:
            print(f"Erro ao buscar/criar perfil do usuário: {e}")
            # Retornar perfil padrão em caso de erro
            return AIUserProfile(
                user_uid=user_uid,
                preferred_destinations=[],
                travel_preferences={},
                budget_range={"min": 0, "max": 1000},
                preferred_dates=[],
                travel_history=[],
                ai_learning_data={},
                last_updated=datetime.utcnow()
            )
    
    def update_user_profile(self, profile: AIUserProfile) -> bool:
        """Atualiza perfil do usuário"""
        try:
            profile.last_updated = datetime.utcnow()
            doc_ref = self.db.collection('ai_user_profiles').document(profile.user_uid)
            doc_ref.set(profile.to_dict())
            return True
        except Exception as e:
            print(f"Erro ao atualizar perfil: {e}")
            return False
    
    def save_insight(self, insight: AITravelInsight) -> str:
        """Salva um insight de viagem"""
        try:
            doc_ref = self.db.collection('ai_insights').document()
            insight.id = doc_ref.id
            doc_ref.set(insight.to_dict())
            return doc_ref.id
        except Exception as e:
            print(f"Erro ao salvar insight: {e}")
            raise
    
    def get_user_insights(self, user_uid: str, limit: int = 5) -> List[AITravelInsight]:
        """Busca insights para um usuário"""
        try:
            insights = []
            query = (self.db.collection('ai_insights')
                    .where('user_uid', '==', user_uid)
                    .where('is_relevant', '==', True)
                    .order_by('created_at', direction='DESCENDING')
                    .limit(limit))
            
            for doc in query.stream():
                data = doc.to_dict()
                data['id'] = doc.id
                insights.append(AITravelInsight.from_dict(data))
            
            return insights
        except Exception as e:
            print(f"Erro ao buscar insights: {e}")
            return []
