import axios from "axios";
import { toast } from "react-toastify";

const API_URL = process.env.REACT_APP_HOST + "/api/";

export const renouv_domiciliation = async (
  verify_payload,
  payload,
  navigate
) => {
  const token = JSON.parse(localStorage.getItem("token"));

  try {
    const result = await axios.post(`${API_URL}user/exist`, verify_payload);

    if (result.data.status === 200) {
      const res = await axios.post(`${API_URL}user/demandes`, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status == 200) {
        const id_demande = res?.data?.demande?.id;

        const new_payload = {
          champs_questionnaire: res?.data?.demande?.champs_demande,
        };
        const champs_questionnaire = JSON.stringify(new_payload);
        console.log("transform key", champs_questionnaire);

        try {
          const response = await axios.put(
            `${API_URL}admin/demandes/${id_demande}/champs-questionnaire`,
            champs_questionnaire,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.status === 200) {
            // generer le document
            try {
              axios
                .post(
                  `${API_URL}admin/demandes/${id_demande}/documents/regenerate`,
                  {},
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  }
                )
                .then((result) => {
                  toast.success("Les documents ont été générés avec succès.");
                  try {
                    axios
                      .post(
                        `${API_URL}/toosign/demande/${id_demande}`,
                        {},
                        {
                          headers: {
                            Authorization: `Bearer ${token}`,
                          },
                        }
                      )
                      .then((res) => console.log(res));
                  } catch (error) {
                    console.log(error);
                  }
                })
                .catch((error) => {
                  toast.error(
                    "Une erreur s'est produite lors de la génération de documents."
                  );
                });
            } catch (e) {
              toast.error(
                "Une erreur s'est produite, veuillez contacter le service client."
              );
            }
            //fin geneation de document
            toast.success(
              "Le renouvellement de domiciliation à été créé avec succès !"
            );
            navigate("/demands/list");
          } else {
            toast.error(
              "Un problème est survenu, veuillez contacter le service client."
            );
          }
        } catch (error) {
          console.error("Erreur", error);
          toast.error(
            "Un problème est survenu, veuillez contacter le service client."
          );
        }
      } else {
        toast.error(
          "Un problème est survenu veuillez contacter le service client."
        );
      }
    }
  } catch (error) {
    console.error("Error", error);
    toast.error(
      "Un problème est survenu veuillez contacter le service client."
    );
  }
};
