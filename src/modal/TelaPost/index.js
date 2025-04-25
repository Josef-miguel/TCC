import { View, Text, ScrollView, TouchableOpacity, Button, Modal, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const PostScreen = ({modalVisible, setModalVisible, selectedPost, setSelectedPost}) => {
    const closeModal = () => {
        setModalVisible(false);
        setSelectedPost(null);
    };

    

    if(selectedPost != null && modalVisible){
        return (
            <Modal visible={modalVisible} transparent animationType="slide">
            <View style={styles.modalContainer}>
              <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalInner}>
                {selectedPost && (
                  <>
                    <Text style={styles.sectionTitle}>Imagens do destino</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                      {selectedPost.images.map((uri, i) => (
                        <Image key={i} source={{ uri }} style={styles.destImage} />
                      ))}
                    </ScrollView>
                    <Text style={styles.sectionTitle}>Trajeto da viagem</Text>
                    <View style={styles.routeBox}><Ionicons name="location-sharp" size={24}/><Text style={styles.routeText}>{selectedPost.route}</Text></View>
                    <Text style={styles.sectionTitle}>Informações da excursão</Text>
                    <View style={styles.infoBox}><Text>{selectedPost.excursionInfo}</Text></View>
                    <Text style={styles.sectionTitle}>Avaliação</Text>
                    <View style={styles.ratingBox}><Ionicons name="star" size={20}/><Text style={styles.ratingText}>{selectedPost.rating}/10</Text></View>
                    <Text style={styles.sectionTitle}>Comentários</Text>
                    <View style={styles.commentsBox}>{selectedPost.comments.map((c, idx) => (<Text key={idx} style={styles.commentText}>"{c}"</Text>))}</View>
                    <TouchableOpacity style={styles.modalButton}><Text style={styles.buttonText}>Entrar em contato com o organizador</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.modalButton, styles.joinButton]}><Text style={styles.buttonText}>Participar da viagem</Text></TouchableOpacity>
                    <Button title="Fechar" onPress={closeModal} color="red" />
                  </>
                )}
              </ScrollView>
            </View>
          </Modal>
    
        );
    }

    
}

const styles = StyleSheet.create({
    modalButton: { padding: 12, backgroundColor: '#2196f3', borderRadius: 6, marginBottom: 8, alignItems: 'center' },
    modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
    modalScroll: { margin: 20, backgroundColor: '#fff', borderRadius: 8 },
    modalInner: { padding: 16 },
    infoBox: { padding: 8, borderWidth: 1, borderRadius: 6, marginBottom: 12 },
    ratingBox: { flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: '#ffeb3b', borderRadius: 6, marginBottom: 12 },
    ratingText: { marginLeft: 6 },
    commentsBox: { padding: 8, borderWidth: 1, borderRadius: 6, marginBottom: 12 },
    commentText: { marginBottom: 4, fontStyle: 'italic' },
    routeBox: { flexDirection: 'row', alignItems: 'center', padding: 8, borderWidth: 1, borderRadius: 6, marginBottom: 12 },
    sectionTitle: { fontWeight: 'bold', marginTop: 12, marginBottom: 6 },
    imageScroll: { marginBottom: 12 },
    destImage: { width: 150, height: 100, borderRadius: 6, marginRight: 8 },
    routeText: { marginLeft: 8 },  
    joinButton: { backgroundColor: '#4caf50' },
    buttonText: { color: '#fff', fontWeight: 'bold' }
});

export default PostScreen;

{/* <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalInner}>
            {selectedPost && (
              <>
                <Text style={styles.sectionTitle}>Imagens do destino</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                  {selectedPost.images.map((uri, i) => (
                    <Image key={i} source={{ uri }} style={styles.destImage} />
                  ))}
                </ScrollView>
                <Text style={styles.sectionTitle}>Trajeto da viagem</Text>
                <View style={styles.routeBox}><Ionicons name="location-sharp" size={24}/><Text style={styles.routeText}>{selectedPost.route}</Text></View>
                <Text style={styles.sectionTitle}>Informações da excursão</Text>
                <View style={styles.infoBox}><Text>{selectedPost.excursionInfo}</Text></View>
                <Text style={styles.sectionTitle}>Avaliação</Text>
                <View style={styles.ratingBox}><Ionicons name="star" size={20}/><Text style={styles.ratingText}>{selectedPost.rating}/10</Text></View>
                <Text style={styles.sectionTitle}>Comentários</Text>
                <View style={styles.commentsBox}>{selectedPost.comments.map((c, idx) => (<Text key={idx} style={styles.commentText}>"{c}"</Text>))}</View>
                <TouchableOpacity style={styles.modalButton}><Text style={styles.buttonText}>Entrar em contato com o organizador</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.joinButton]}><Text style={styles.buttonText}>Participar da viagem</Text></TouchableOpacity>
                <Button title="Fechar" onPress={closeModal} color="red" />
              </>
            )}
          </ScrollView>
        </View>
      </Modal> */}